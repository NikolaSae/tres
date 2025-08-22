// Path: app/(protected)/complaints/[id]/ComplaintDetailPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, notFound } from "next/navigation";
import { useSession } from "next-auth/react"; // Assuming you use next-auth for session management
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
        comments: ({ id: string; text: string; createdAt: Date; isInternal: boolean; userId: string; user: { id: string; name: string | null; email: string | null } } | null)[];
        attachments: ({ id: string; name: string; fileUrl: string; complaintId: string; uploadedAt: Date } | null)[];
        statusHistory: ({ id: string; complaintId: string; previousStatus: ComplaintStatus; newStatus: ComplaintStatus; changedAt: Date; changedById: string | null; notes: string | null } | null)[];
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

    // Use the useComplaints hook, but potentially initialize it with server data
    // This hook might need modification to accept initialData and handle refreshing
    // For now, we'll keep the existing hook call, assuming 'refresh' works correctly.
    // A more advanced pattern would be to use initialData and mutate cache.
    const { complaint, isLoading, error, refresh } = useComplaints({ id: id as string }, initialComplaint);


    // Get current user session and status
    const { data: session, status } = useSession();

    // Extract current user ID and role from the session
    const currentUserId = session?.user?.id;
    const userRole = session?.user?.role as UserRole | undefined | null; // Cast role to UserRole enum type

    // State for new comment input
    const [newComment, setNewComment] = useState("");
    // State for loading indicators for specific actions
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    // State for delete confirmation dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


    // Effect to show a toast notification if there's an error loading complaint data
    // This effect might be less critical if initial data is always provided on server
    useEffect(() => {
      if (error) {
        toast.error("Error loading complaint details");
      }
    }, [error]);


    // Display loading state while fetching user session
    if (status === 'loading') {
      return (
        <div className="container mx-auto py-8 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          Loading user session...
        </div>
      );
    }

    // Display loading state while fetching complaint data (after session is loaded)
    // This might still be needed if the useComplaints hook fetches data client-side initially
    if (isLoading) {
      return (
        <div className="container mx-auto py-8 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          Loading complaint...
        </div>
      );
    }

    // If complaint is not found (should be handled by Server Component's notFound),
    // or if initial data wasn't provided and hook failed
    if (!complaint && !isLoading && status !== 'loading') {
      // This case should ideally not be reached if the Server Component uses notFound
      // but as a fallback, we can still show 404 or null. notFound() is preferred.
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

        if (result?.success) {
          toast.success("Status updated successfully");
          refresh(); // Re-fetch complaint data to update UI
        } else {
          toast.error(result?.error || "Failed to update status");
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

        if (result?.success) {
          toast.success("Comment added successfully");
          setNewComment(""); // Clear comment input
          refresh(); // Re-fetch complaint data to update UI with new comment
        } else {
          toast.error(result?.error || "Failed to add comment");
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

        if (result?.success) {
          toast.success("Complaint deleted successfully");
          router.push("/complaints"); // Redirect to complaints list after deletion
        } else {
          toast.error(result?.error || "Failed to delete complaint");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
      } finally {
        setIsDeleting(false); // Reset loading state
        setIsDeleteDialogOpen(false); // Close dialog
      }
    };

    // Render null if complaint data is not yet available (should be handled by Server Component)
    // This is a fallback, ideally the Server Component ensures complaint is valid or calls notFound
    if (!complaint) {
         return null;
     }


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
                disabled={isLoading} // Disable while initial data is loading
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
                disabled={isDeleting || isLoading} // Disable while deleting or initial data loading
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
                  <ComplaintTimeline statusHistory={complaint.statusHistory || []} /> {/* Pass status history array */}
                </TabsContent>

                {/* Attachments Tab Content */}
                <TabsContent value="attachments">
                  {/* File upload section (visible if user can manage attachments) */}
                  {canManageAttachments && (
                    <FileUpload
                         complaintId={complaint.id}
                         existingAttachments={complaint.attachments || []} // Pass existing attachments
                         onUploadComplete={refresh} // Refresh data after upload
                         // You might need to pass a delete handler to FileUpload if it supports deleting attachments
                     />
                  )}
                  {/* Display existing attachments if user cannot manage but attachments exist */}
                  {!canManageAttachments && complaint.attachments && complaint.attachments.length > 0 && (
                     <div className="space-y-2">
                         <p className="text-sm font-medium text-muted-foreground">Attachments</p>
                         {complaint.attachments.map(attachment => (
                             <div key={attachment.id} className="text-sm">
                                 {/* Link to attachment file */}
                                 <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" className="underline">{attachment.name}</a>
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
                     assignableUsers={assignableUsers} // Pass the list of assignable users
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
