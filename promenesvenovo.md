# Bugfix bundle

Ovaj fajl sadrzi sve izmenjene fajlove nakon pokretanja build-a i ispravki tip gresaka.

## `app/(protected)/complaints/[id]/ComplaintDetailPageClient.tsx`
```tsx
// Path: app/(protected)/complaints/[id]/ComplaintDetailPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, notFound } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Send } from "lucide-react";
import StatusBadge from "@/components/complaints/StatusBadge"; // Custom component for status badge
import CommentSection from "@/components/complaints/CommentSection"; // Custom component for comments
import { ComplaintTimeline } from "@/components/complaints/ComplaintTimeline"; // Custom component for timeline
import { FileUpload } from "@/components/complaints/FileUpload"; // Custom component for file uploads
import { Separator } from "@/components/ui/separator"; // Shadcn UI Separator
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Shadcn UI Tabs
import { Textarea } from "@/components/ui/textarea"; // Shadcn UI Textarea
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // Shadcn UI Dialog
import { toast } from "sonner"; // Assuming you use sonner for toasts
import { ComplaintStatus, UserRole, Complaint } from "@prisma/client"; // Import enums and Complaint type from Prisma client
import { formatDate } from "@/lib/utils"; // Utility function for date formatting
import { formatCurrency } from "@/lib/formatters"; // Function for currency formatting
import { useComplaints } from "@/hooks/use-complaints"; // Custom hook for fetching complaints (will use initial data now)
import { changeComplaintStatus } from "@/actions/complaints/change-status"; // Server action to change status
import { addComment } from "@/actions/complaints/comment"; // Server action to add comment
import { deleteComplaint } from "@/actions/complaints/delete"; // Server action to delete complaint
import { AssignComplaint } from "@/components/complaints/AssignComplaint"; // !!! IMPORT NEW COMPONENT !!!
import { type getAssignableUsers } from "@/actions/users/get-assignable-users"; // Import type for assignable users


// Define props for the Client Component
interface ComplaintDetailPageClientProps {
    initialComplaint: Complaint & { // Extend Complaint type with relations included in the server fetch
        submittedBy: { id: string; name: string | null; email: string | null } | null;
        assignedAgent: { id: string; name: string | null; email: string | null } | null;
        service: { id: string; name: string; type: string } | null;
        product: { id: string; name: string; code: string } | null;
        provider: { id: string; name: string } | null;
        humanitarianOrg?: { id: string; name: string } | null; // Optional relation
        comments: { id: string; text: string; createdAt: Date; isInternal: boolean; userId: string; user: { id: string; name: string | null; email: string | null } }[];
        attachments: { id: string; fileName: string; fileUrl: string; fileType: string; complaintId: string; uploadedAt: Date }[];
        statusHistory: { id: string; complaintId: string; previousStatus: ComplaintStatus | null; newStatus: ComplaintStatus; changedAt: Date; changedById: string; notes: string | null }[];
    };
    assignableUsers: Awaited<ReturnType<typeof getAssignableUsers>>['users']; // Use the type from the server action
}


export default function ComplaintDetailPageClient({
    initialComplaint,
    assignableUsers,
}: ComplaintDetailPageClientProps) {
    // Get router and complaint ID from URL parameters (still needed for some actions/redirects)
    const router = useRouter();
    const { id } = useParams<{ id: string }>();

    // Use initialComplaint directly - no need to fetch again on mount since we have server data
    const [complaint, setComplaint] = useState(initialComplaint);
    const [isRefetching, setIsRefetching] = useState(false);

    // Helper function to refresh complaint data when needed
    const refresh = async () => {
        setIsRefetching(true);
        try {
            const response = await fetch(`/api/complaints/${id}`);
            if (response.ok) {
                const data = await response.json();
                setComplaint(data);
            }
        } catch (error) {
            console.error("Error refreshing complaint:", error);
            toast.error("Failed to refresh complaint data");
        } finally {
            setIsRefetching(false);
        }
    };

    // Get current user session and status
    const { data: session, status } = useSession();

    // Extract current user ID and role from the session
    // Note: Using type assertion because TypeScript may not recognize extended session types during build
    const currentUserId = session?.user?.id;
    const userRole = ((session?.user as any)?.role ?? null) as UserRole | null;

    // State for new comment input
    const [newComment, setNewComment] = useState("");
    // State for loading indicators for specific actions
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    // State for delete confirmation dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


    // Display loading state while fetching user session
    if (status === 'loading') {
      return (
        <div className="container mx-auto py-8 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          Loading user session...
        </div>
      );
    }

    // If complaint is not found (should be handled by Server Component's notFound),
    if (!complaint) {
       notFound();
    }

    // Determine user permissions based on role and relationship to the complaint
    const isAdmin = userRole === UserRole.ADMIN;
    const isManager = userRole === UserRole.MANAGER;
    const isAgent = userRole === UserRole.AGENT;
    const isOwner = complaint?.submittedById === currentUserId;
    const isAssignedAgent = complaint?.assignedAgentId === currentUserId;

    // Permissions flags
    const canEdit = isAdmin || isManager || isOwner; // Can edit if Admin, Manager, or the owner
    const canDelete = isAdmin || isManager; // Can delete if Admin or Manager
    // Can change status if Admin, Manager, or an Agent assigned to the complaint
    const canChangeStatus = isAdmin || isManager || (isAgent && isAssignedAgent);
    // Can add a comment if logged in
    const canAddComment = !!currentUserId;
    // Can manage attachments if Admin, Manager, Owner, or Assigned Agent
    const canManageAttachments = isAdmin || isManager || isOwner || isAssignedAgent;
    // Can assign complaint if Admin or Manager
    const canAssign = isAdmin || isManager;

    const timelineHistory = complaint.statusHistory ?? [];

    const existingAttachments = complaint.attachments ?? [];


    // Handler for changing complaint status
    const handleChangeStatus = async (newStatus: ComplaintStatus) => {
      // Basic checks for required data and permissions
      if (!complaint || !currentUserId || !userRole) {
        toast.error("Cannot change status: User or complaint data missing.");
        return;
      }
      if (!canChangeStatus) {
        toast.error("You do not have permission to change the status of this complaint.");
        return;
      }

      try {
        setIsChangingStatus(true); // Set loading state
        // Call the server action to change status
        const result = await changeComplaintStatus({
          complaintId: complaint.id,
          status: newStatus,
          // You might add a comment field here if your changeStatus action supports it
        });

        if (result?.error) {
          toast.error(result.error || "Failed to update status");
        } else {
          toast.success("Status updated successfully");
          refresh(); // Re-fetch complaint data to update UI
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
      } finally {
        setIsChangingStatus(false); // Reset loading state
      }
    };

    // Handler for submitting a new comment
    const handleCommentSubmit = async () => {
      // Basic checks for required data and comment content
      if (!complaint || !newComment.trim() || !currentUserId) {
        if (!currentUserId) toast.error("Please log in to add a comment.");
        else if (!newComment.trim()) toast.error("Comment cannot be empty.");
        return;
      }

      try {
        setIsSubmittingComment(true); // Set loading state
        // Call the server action to add a comment
        const result = await addComment({
          complaintId: complaint.id,
          text: newComment.trim(), // Trim whitespace from comment
          isInternal: false // Assuming comments from this form are public
        });

        if (result?.error) {
          toast.error(result.error || "Failed to add comment");
        } else {
          toast.success("Comment added successfully");
          setNewComment(""); // Clear comment input
          refresh(); // Re-fetch complaint data to update UI with new comment
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
      } finally {
        setIsSubmittingComment(false); // Reset loading state
      }
    };

    // Handler for deleting the complaint
    const handleDelete = async () => {
      // Basic checks for required data and permissions
      if (!complaint || !currentUserId || !userRole) {
        toast.error("Cannot delete complaint: User or complaint data missing.");
        setIsDeleteDialogOpen(false); // Close dialog
        return;
      }
      if (!canDelete) {
        toast.error("You do not have permission to delete this complaint.");
        setIsDeleteDialogOpen(false); // Close dialog
        return;
      }

      try {
        setIsDeleting(true); // Set loading state
        // Call the server action to delete the complaint
        const result = await deleteComplaint(complaint.id);

        if (result?.error) {
          toast.error(result.error || "Failed to delete complaint");
        } else {
          toast.success("Complaint deleted successfully");
          router.push("/complaints"); // Redirect to complaints list after deletion
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
      } finally {
        setIsDeleting(false); // Reset loading state
        setIsDeleteDialogOpen(false); // Close dialog
      }
    };


    // Main render function once data is loaded
    return (
      <div className="container mx-auto py-8 space-y-6">
        {/* Header with back button, title, and action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back button */}
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-0 h-auto"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {/* Complaint title */}
            <h1 className="text-3xl font-bold">{complaint.title}</h1>
          </div>

          {/* Action buttons (Edit and Delete) */}
          <div className="flex items-center gap-2">
            {/* Edit button - visible if user has edit permission */}
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => router.push(`/complaints/${complaint.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {/* Delete button - visible if user has delete permission */}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)} // Open delete confirmation dialog
                disabled={isDeleting} // Disable while deleting
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column (Complaint Details, Comments, Timeline, Attachments) */}
          <div className="md:col-span-2 space-y-6">
            {/* Complaint Details Card */}
            <div className="bg-card p-6 rounded-lg shadow">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Complaint ID */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono text-sm">{complaint.id}</span>
                </div>
                {/* Complaint Status */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <StatusBadge status={complaint.status} /> {/* Use custom StatusBadge component */}
                </div>
                {/* Complaint Priority */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Priority:</span>
                  <span className="font-medium">{complaint.priority}</span>
                </div>
                {/* Creation Date */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(complaint.createdAt)}</span> {/* Use utility function to format date */}
                </div>
              </div>

              <Separator className="my-4" />

              {/* Complaint Description */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Description</h2>
                {/* whitespace-pre-wrap preserves line breaks from textarea input */}
                <p className="whitespace-pre-wrap">{complaint.description}</p>
              </div>

              {/* Financial Impact Display (conditionally rendered) */}
              {complaint.financialImpact !== null && complaint.financialImpact !== undefined && (
                 <>
                   <Separator className="my-4" />
                   <div className="space-y-4">
                       <h2 className="text-xl font-semibold">Financial Impact</h2>
                       {/* Koristimo formatCurrency za formatiranje broja */}
                       <p className="text-2xl font-bold">{formatCurrency(complaint.financialImpact)}</p>
                   </div>
                 </>
              )}
            </div>

            {/* Tabs for Comments, Timeline, and Attachments */}
            <div className="bg-card p-6 rounded-lg shadow">
              <Tabs defaultValue="comments">
                <TabsList className="mb-4">
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="attachments">Attachments</TabsTrigger>
                </TabsList>

                {/* Comments Tab Content */}
                <TabsContent value="comments" className="space-y-4">
                  {/* Display existing comments */}
                  <CommentSection
                    complaintId={complaint.id}
                    comments={complaint.comments || []} // Pass comments array
                    currentUserId={currentUserId}
                    userRole={userRole}
                    // You might need to pass refresh function or a specific comment add handler down
                    // if CommentSection itself can delete/edit comments
                  />
                  {/* Add new comment section (visible if user can add comments) */}
                  {canAddComment && (
                    <div className="mt-4">
                         {/* Textarea for new comment input */}
                         <Textarea
                             placeholder="Add a comment..."
                             value={newComment}
                             onChange={(e) => setNewComment(e.target.value)}
                             rows={3}
                             disabled={isSubmittingComment} // Disable while submitting
                         />
                         {/* Button to submit new comment */}
                         <Button
                             onClick={handleCommentSubmit} // Call comment submission handler
                             disabled={isSubmittingComment || !newComment.trim()} // Disable if submitting or comment is empty
                             className="mt-2"
                         >
                             {isSubmittingComment ? (
                                 // Loading spinner for comment submission
                                 <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                             ) : (
                                 <Send className="h-4 w-4 mr-2" /> // Send icon
                             )}
                             Post Comment
                         </Button>
                     </div>
                  )}
                </TabsContent>

                {/* Timeline Tab Content */}
                <TabsContent value="timeline">
                  {/* Display complaint status history */}
                  <ComplaintTimeline statusHistory={timelineHistory} /> {/* Pass status history array */}
                </TabsContent>

                {/* Attachments Tab Content */}
                <TabsContent value="attachments">
                  {/* File upload section (visible if user can manage attachments) */}
                  {canManageAttachments && (
                    <FileUpload
                         complaintId={complaint.id}
                         existingAttachments={existingAttachments} // Pass existing attachments
                         // You might need to pass a delete handler to FileUpload if it supports deleting attachments
                     />
                  )}
                  {/* Display existing attachments if user cannot manage but attachments exist */}
                  {!canManageAttachments && complaint.attachments && complaint.attachments.length > 0 && (
                     <div className="space-y-2">
                         <p className="text-sm font-medium text-muted-foreground">Attachments</p>
                         {existingAttachments.map(attachment => (
                             <div key={attachment.id} className="text-sm">
                                 {/* Link to attachment file */}
                                 <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" className="underline">{attachment.fileName}</a>
                             </div>
                         ))}
                     </div>
                  )}
                  {/* Message if no attachments and user cannot manage */}
                   {!canManageAttachments && (!complaint.attachments || complaint.attachments.length === 0) && (
                        <p className="text-sm text-muted-foreground">No attachments found.</p>
                    )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right column (Details and Actions) */}
          <div className="space-y-6">
            {/* Details Card */}
            <div className="bg-card p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Details</h2>

              <div className="space-y-3">
                {/* Submitted By */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submitted By</p>
                  <p>{complaint.submittedBy?.name || 'Unknown'}</p> {/* Display submitted by user's name */}
                </div>

                {/* Assigned To */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                  <p>{complaint.assignedAgent?.name || 'Not assigned'}</p> {/* Display assigned agent's name */}
                </div>

                {/* Service (conditionally rendered if service exists) */}
                {complaint.service && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Service</p>
                    <p>{complaint.service.name}</p> {/* Display service name */}
                  </div>
                )}

                {/* Product (conditionally rendered if product exists) */}
                {complaint.product && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Product</p>
                    <p>{complaint.product.name}</p> {/* Display product name */}
                  </div>
                )}

                {/* Provider (conditionally rendered if provider exists) */}
                {complaint.provider && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Provider</p>
                    <p>{complaint.provider.name}</p> {/* Display provider name */}
                  </div>
                )}

                 {/* Humanitarian Organization (conditionally rendered if it exists) */}
                 {complaint.humanitarianOrg && (
                     <div>
                      <p className="text-sm font-medium text-muted-foreground">Humanitarian Organization</p>
                      <p>{complaint.humanitarianOrg.name}</p> {/* Display humanitarian organization name */}
                     </div>
                 )}
              </div>
            </div>

            {/* Assign Complaint Component */}
            {/* Render the new component if user has permission to assign */}
            {canAssign && (
                 <AssignComplaint
                     complaintId={complaint.id}
                     currentAssignedAgentId={complaint.assignedAgentId}
                     assignableUsers={assignableUsers ?? []} // Pass the list of assignable users
                     canAssign={canAssign} // Pass the permission flag
                     onAssignmentComplete={refresh} // Pass the refresh function to update data after assignment
                 />
            )}


            {/* Actions Card (Status Change Buttons) */}
            <div className="bg-card p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Actions</h2>

              <div className="space-y-3">
                 {/* Status change buttons (visible if user can change status) */}
                 {canChangeStatus && (
                     <div className="grid grid-cols-1 gap-2">
                         {/* Button to change status to ASSIGNED */}
                         <Button
                             variant="outline"
                             className="w-full justify-start"
                             disabled={isChangingStatus || complaint.status === ComplaintStatus.ASSIGNED} // Disable if submitting or already this status
                             onClick={() => handleChangeStatus(ComplaintStatus.ASSIGNED)} // Call status change handler
                         >
                             Assign
                         </Button>

                         {/* Button to change status to IN_PROGRESS */}
                         <Button
                             variant="outline"
                             className="w-full justify-start"
                             disabled={isChangingStatus || complaint.status === ComplaintStatus.IN_PROGRESS}
                             onClick={() => handleChangeStatus(ComplaintStatus.IN_PROGRESS)}
                         >
                             Mark as In Progress
                         </Button>

                         {/* Button to change status to RESOLVED */}
                         <Button
                             variant="outline"
                             className="w-full justify-start"
                             disabled={isChangingStatus || complaint.status === ComplaintStatus.RESOLVED}
                             onClick={() => handleChangeStatus(ComplaintStatus.RESOLVED)}
                         >
                             Mark as Resolved
                         </Button>

                         {/* Button to change status to CLOSED */}
                         <Button
                             variant="outline"
                             className="w-full justify-start"
                             disabled={isChangingStatus || complaint.status === ComplaintStatus.CLOSED}
                             onClick={() => handleChangeStatus(ComplaintStatus.CLOSED)}
                         >
                             Close Complaint
                         </Button>

                         {/* Button to change status to REJECTED */}
                         <Button
                             variant="outline"
                             className="w-full justify-start"
                             disabled={isChangingStatus || complaint.status === ComplaintStatus.REJECTED}
                             onClick={() => handleChangeStatus(ComplaintStatus.REJECTED)}
                         >
                             Reject Complaint
                         </Button>
                     </div>
                 )}
                  {/* Message if user cannot change status */}
                  {!canChangeStatus && (
                      <p className="text-sm text-muted-foreground">You do not have permission to change the status of this complaint.</p>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this complaint? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              {/* Cancel button for the dialog */}
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting} // Disable while deletion is in progress
              >
                Cancel
              </Button>
              {/* Confirm Delete button */}
              <Button
                variant="destructive"
                onClick={handleDelete} // Call delete handler
                disabled={isDeleting} // Disable while deletion is in progress
              >
                {isDeleting ? (
                  // Loading spinner for delete button
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" /> // Trash icon
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    );
}

```

## `app/(protected)/complaints/[id]/edit/page.tsx`
```tsx
// app/(protected)/complaints/[id]/edit/page.tsx


"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { ComplaintForm } from "@/components/complaints/ComplaintForm";
import { NotificationBanner } from "@/components/complaints/NotificationBanner";
import { getComplaintById } from "@/lib/actions/complaints";
import { updateComplaint } from "@/actions/complaints/update";
import { Complaint } from "@/lib/types/interfaces";
import { Complaint as PrismaComplaint } from "@prisma/client";
import { Loader2 } from "lucide-react";

export default function EditComplaintPage() {
  const params = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const id = params?.id as string;
        if (!id) {
          setError("Complaint ID is missing");
          setLoading(false);
          return;
        }

        const data = await getComplaintById(id);
        if (!data) {
          setError("Complaint not found");
          setLoading(false);
          return;
        }

        setComplaint(data);
      } catch (err) {
        setError("Failed to load complaint");
        console.error("Error loading complaint:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [params]);

  const handleSubmit = async (formData: any) => {
    try {
      if (!complaint?.id) return;
      
      setLoading(true);
      await updateComplaint({
        id: complaint.id,
        ...formData
      });
      
      setNotification({
        type: "success",
        message: "Complaint updated successfully"
      });
      
      setTimeout(() => {
        router.push(`/complaints/${complaint.id}`);
      }, 1500);
    } catch (err) {
      console.error("Error updating complaint:", err);
      setNotification({
        type: "error",
        message: "Failed to update complaint"
      });
    } finally {
      setLoading(false);
    }
  };

  const complaintForForm: PrismaComplaint | null = complaint
    ? {
        ...complaint,
        financialImpact: complaint.financialImpact ?? null,
        serviceId: complaint.serviceId ?? null,
        productId: complaint.productId ?? null,
        providerId: complaint.providerId ?? null,
        assignedAgentId: complaint.assignedAgentId ?? null,
        assignedAt: complaint.assignedAt ?? null,
        resolvedAt: complaint.resolvedAt ?? null,
        closedAt: complaint.closedAt ?? null,
        humanitarianOrgId: complaint.humanitarianOrgId ?? null,
        parkingServiceId: complaint.parkingServiceId ?? null,
      }
    : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Complaint</h1>
      
      {notification && (
        <NotificationBanner
          title={notification.type === "success" ? "Success" : "Error"}
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      {complaintForForm && (
        <ComplaintForm
          complaint={complaintForForm}
          onSubmit={handleSubmit}
          isSubmitting={loading}
        />
      )}
    </div>
  );
}

```

## `app/(protected)/complaints/page.tsx`
```tsx
// app/(protected)/complaints/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ComplaintList } from "@/components/complaints/ComplaintList";
import { ComplaintFilters, ComplaintFiltersState } from "@/components/complaints/ComplaintFilters";
import { NotificationBanner } from "@/components/complaints/NotificationBanner";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { useComplaints } from "@/hooks/use-complaints";
import { ComplaintStatus } from "@/lib/types/enums";

export default function ComplaintsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const safeDate = useCallback((dateString: string | null | undefined): Date | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  }, []);

  const status = searchParams.get("status") as ComplaintStatus | null;
  const serviceId = searchParams.get("serviceId");
  const providerId = searchParams.get("providerId");
  const productId = searchParams.get("productId");
  const startDateString = searchParams.get("startDate");
  const endDateString = searchParams.get("endDate");
  const search = searchParams.get("search");

  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;
  const pageSize = 10;

  const queryParams = useMemo(() => ({
    status: status || undefined,
    serviceId: serviceId || undefined,
    providerId: providerId || undefined,
    productId: productId || undefined,
    startDate: safeDate(startDateString),
    endDate: safeDate(endDateString),
    search: search || undefined,
    limit: pageSize,
    page: currentPage,
  }), [status, serviceId, providerId, productId, startDateString, endDateString, search, currentPage, pageSize, safeDate]);

  const { complaints, isLoading, error, totalCount } = useComplaints(queryParams);
  const complaintItems = complaints ?? [];

  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info"; } | null>(null);

  useEffect(() => {
    const message = searchParams.get("message");
    const type = searchParams.get("type") as "success" | "error" | "info" | null;
    if (message && type) {
      setNotification({ message, type });
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handlePageChange = useCallback((page: number) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("page", page.toString());
    router.push(`/complaints?${currentParams.toString()}`);
  }, [router, searchParams]);

  const handleFilterChange = useCallback((filters: ComplaintFiltersState) => {
    const newParams = new URLSearchParams();
    if (filters.statuses?.length) filters.statuses.forEach(status => newParams.append("status", status));
    if (filters.serviceId) newParams.append("serviceId", filters.serviceId);
    if (filters.providerId) newParams.append("providerId", filters.providerId);
    if (filters.dateRange?.from && !isNaN(filters.dateRange.from.getTime())) newParams.append("startDate", filters.dateRange.from.toISOString());
    if (filters.dateRange?.to && !isNaN(filters.dateRange.to.getTime())) newParams.append("endDate", filters.dateRange.to.toISOString());
    newParams.set("page", "1");
    router.push(`/complaints?${newParams.toString()}`);
  }, [router]);

  const hasActiveFilters = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    return params.toString().length > 0;
  }, [searchParams]);

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
    if (error) return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-md">
        Error loading complaints: {error.message}
      </div>
    );
    if (complaintItems.length === 0) return (
      <div className="text-center py-8 text-muted-foreground">
        {currentPage === 1 && !hasActiveFilters ? "No complaints found." : "No complaints found matching the criteria."}
      </div>
    );
    return (
      <ComplaintList
        complaints={complaintItems}
        totalComplaints={totalCount}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        userRole="ADMIN"
      />
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6 top-0">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Complaints Management</h1>
        <Button
          onClick={() => router.push("/complaints/new")}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Complaint
        </Button>
      </div>

      {/* Notification */}
      {notification && (
        <NotificationBanner
          title={notification.type === "success" ? "Success" : notification.type === "error" ? "Error" : "Info"}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Filters */}
      <div className="card bg-card text-card-foreground p-4 rounded-lg shadow-container">
        <ComplaintFilters
          filters={{
            statuses: status ? [status] : [],
            serviceId: serviceId || undefined,
            providerId: providerId || undefined,
            dateRange: { from: safeDate(startDateString), to: safeDate(endDateString) }
          }}
          onFiltersChange={handleFilterChange}
        />
      </div>

      {/* Content */}
      <div className="space-y-4">
        {renderContent()}
      </div>
    </div>
  );
}

```

## `components/complaints/ComplaintList.tsx`
```tsx
// Fixed ComplaintList Component
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import type { ComplaintWithRelations } from "@/lib/types/complaint-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import StatusBadge from "./StatusBadge";
import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { deleteComplaint } from "@/actions/complaints/delete";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface ComplaintListProps {
  complaints: ComplaintWithRelations[];
  totalComplaints: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  userRole: string;
}

export function ComplaintList({
  complaints,
  totalComplaints,
  page,
  pageSize,
  onPageChange,
  userRole,
}: ComplaintListProps) {
  const router = useRouter();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalPages = Math.ceil(totalComplaints / pageSize);
  const isAdmin = userRole === "ADMIN" || userRole === "MANAGER";

  const handleView = (id: string) => {
    router.push(`/complaints/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/complaints/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await deleteComplaint(deleteId);
      toast.success("Complaint has been deleted");
      setDeleteId(null);
      // Force a refresh - router.refresh() should work in app router
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete complaint");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper function for safe date formatting
  const formatSafeDate = (date: Date | string | null | undefined) => {
    try {
      if (!date) return "N/A";
      const validDate = date instanceof Date ? date : new Date(date);
      if (isNaN(validDate.getTime())) return "Invalid Date";
      return formatDistanceToNow(validDate, { addSuffix: true });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Error";
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!Array.isArray(complaints) || complaints.length === 0) ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No complaints found
                </TableCell>
              </TableRow>
            ) : (
              complaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium">{complaint.title}</TableCell>
                  <TableCell>{complaint.service?.name || "N/A"}</TableCell>
                  <TableCell>{complaint.provider?.name || "N/A"}</TableCell>
                  <TableCell>
                    <StatusBadge status={complaint.status} />
                  </TableCell>
                  <TableCell>{complaint.priority}</TableCell>
                  <TableCell>
                    {formatSafeDate(complaint.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(complaint.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(complaint.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem
                            onClick={() => setDeleteId(complaint.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(Math.max(1, page - 1));
                }} 
                aria-disabled={page === 1}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(pageNum);
                  }}
                  isActive={pageNum === page}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(Math.min(totalPages, page + 1));
                }} 
                aria-disabled={page === totalPages}
                className={page === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the complaint
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```
