// Path: app/(protected)/complaints/[id]/ComplaintDetailPageClient.tsx
"use client";

import { useState } from "react";
import { useRouter, useParams, notFound } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Send } from "lucide-react";
import StatusBadge from "@/components/complaints/StatusBadge";
import CommentSection, { type CommentWithUser } from "@/components/complaints/CommentSection";
import { ComplaintTimeline, type StatusHistoryEntry } from "@/components/complaints/ComplaintTimeline";
import { FileUpload, type FileUploadAttachment } from "@/components/complaints/FileUpload";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ComplaintStatus, UserRole, Complaint, Attachment } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { useComplaints } from "@/hooks/use-complaints";
import { changeComplaintStatus } from "@/actions/complaints/change-status";
import { addComment } from "@/actions/complaints/comment";
import { deleteComplaint } from "@/actions/complaints/delete";
import { AssignComplaint } from "@/components/complaints/AssignComplaint";
import { type getAssignableUsers } from "@/actions/users/get-assignable-users";


// Define attachment type that matches database schema (Prisma Attachment model)
type ComplaintAttachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: Date;
  complaintId: string;
};

// Define props for the Client Component
interface ComplaintDetailPageClientProps {
    initialComplaint: Complaint & {
        submittedBy: { id: string; name: string | null; email: string | null } | null;
        assignedAgent: { id: string; name: string | null; email: string | null } | null;
        service: { id: string; name: string; type: string } | null;
        product: { id: string; name: string; code: string } | null;
        provider: { id: string; name: string } | null;
        humanitarianOrg?: { id: string; name: string } | null;
        comments: (CommentWithUser | null)[];
        attachments: (ComplaintAttachment | null)[];
        statusHistory: (StatusHistoryEntry | null)[];
    };
    assignableUsers: Awaited<ReturnType<typeof getAssignableUsers>>['users'];
}


export default function ComplaintDetailPageClient({
    initialComplaint,
    assignableUsers,
}: ComplaintDetailPageClientProps) {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();

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

    const { data: session, status } = useSession();

    const currentUserId = session?.user?.id;
    const userRole = ((session?.user as any)?.role ?? null) as UserRole | null;

    const [newComment, setNewComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


    if (status === 'loading') {
      return (
        <div className="container mx-auto py-8 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          Loading user session...
        </div>
      );
    }

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
    const canEdit = isAdmin || isManager || isOwner;
    const canDelete = isAdmin || isManager;
    const canChangeStatus = isAdmin || isManager || (isAgent && isAssignedAgent);
    const canAddComment = !!currentUserId;
    const canManageAttachments = isAdmin || isManager || isOwner || isAssignedAgent;
    const canAssign = isAdmin || isManager;


    // Handler for changing complaint status
    const handleChangeStatus = async (newStatus: ComplaintStatus) => {
      if (!complaint || !currentUserId || !userRole) {
        toast.error("Cannot change status: User or complaint data missing.");
        return;
      }
      if (!canChangeStatus) {
        toast.error("You do not have permission to change the status of this complaint.");
        return;
      }

      try {
        setIsChangingStatus(true);
        const result = await changeComplaintStatus({
          complaintId: complaint.id,
          status: newStatus,
        });

        if (result?.error) {
          toast.error(result.error || "Failed to update status");
        } else {
          toast.success("Status updated successfully");
          refresh();
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
      } finally {
        setIsChangingStatus(false);
      }
    };

    // Handler for submitting a new comment
    const handleCommentSubmit = async () => {
      if (!complaint || !newComment.trim() || !currentUserId) {
        if (!currentUserId) toast.error("Please log in to add a comment.");
        else if (!newComment.trim()) toast.error("Comment cannot be empty.");
        return;
      }

      try {
        setIsSubmittingComment(true);
        const result = await addComment({
          complaintId: complaint.id,
          text: newComment.trim(),
          isInternal: false
        });

        if (result?.error) {
          toast.error(result.error || "Failed to add comment");
        } else {
          toast.success("Comment added successfully");
          setNewComment("");
          refresh();
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
      } finally {
        setIsSubmittingComment(false);
      }
    };

    // Handler for deleting the complaint
    const handleDelete = async () => {
      if (!complaint || !currentUserId || !userRole) {
        toast.error("Cannot delete complaint: User or complaint data missing.");
        setIsDeleteDialogOpen(false);
        return;
      }
      if (!canDelete) {
        toast.error("You do not have permission to delete this complaint.");
        setIsDeleteDialogOpen(false);
        return;
      }

      try {
        setIsDeleting(true);
        const result = await deleteComplaint(complaint.id);

        if (result?.error) {
          toast.error(result.error || "Failed to delete complaint");
        } else {
          toast.success("Complaint deleted successfully");
          router.push("/complaints");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
      } finally {
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
      }
    };


    return (
      <div className="container mx-auto py-8 space-y-6">
        {/* Header with back button, title, and action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-0 h-auto"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">{complaint.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => router.push(`/complaints/${complaint.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeleting}
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
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono text-sm">{complaint.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <StatusBadge status={complaint.status} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Priority:</span>
                  <span className="font-medium">{complaint.priority}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(complaint.createdAt)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Description</h2>
                <p className="whitespace-pre-wrap">{complaint.description}</p>
              </div>

              {complaint.financialImpact !== null && complaint.financialImpact !== undefined && (
                 <>
                   <Separator className="my-4" />
                   <div className="space-y-4">
                       <h2 className="text-xl font-semibold">Financial Impact</h2>
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
                  <CommentSection
                    complaintId={complaint.id}
                    comments={complaint.comments || []}
                    currentUserId={currentUserId}
                    userRole={userRole}
                  />
                  {canAddComment && (
                    <div className="mt-4">
                         <Textarea
                             placeholder="Add a comment..."
                             value={newComment}
                             onChange={(e) => setNewComment(e.target.value)}
                             rows={3}
                             disabled={isSubmittingComment}
                         />
                         <Button
                             onClick={handleCommentSubmit}
                             disabled={isSubmittingComment || !newComment.trim()}
                             className="mt-2"
                         >
                             {isSubmittingComment ? (
                                 <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                             ) : (
                                 <Send className="h-4 w-4 mr-2" />
                             )}
                             Post Comment
                         </Button>
                     </div>
                  )}
                </TabsContent>

                {/* Timeline Tab Content */}
                <TabsContent value="timeline">
                  <ComplaintTimeline statusHistory={complaint.statusHistory || []} />
                </TabsContent>

                {/* Attachments Tab Content */}
                <TabsContent value="attachments">
                  {canManageAttachments && (
                    <FileUpload
                         complaintId={complaint.id}
                         existingAttachments={complaint.attachments?.filter((att): att is ComplaintAttachment => att !== null) || []}
                         onUploadComplete={refresh}
                     />
                  )}
                  {!canManageAttachments && complaint.attachments && complaint.attachments.length > 0 && (
                     <div className="space-y-2">
                         <p className="text-sm font-medium text-muted-foreground">Attachments</p>
                         {complaint.attachments.map(attachment => attachment && (
                             <div key={attachment.id} className="text-sm">
                                 <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
                                   {attachment.fileName}
                                 </a>
                             </div>
                         ))}
                     </div>
                  )}
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
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submitted By</p>
                  <p>{complaint.submittedBy?.name || 'Unknown'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                  <p>{complaint.assignedAgent?.name || 'Not assigned'}</p>
                </div>

                {complaint.service && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Service</p>
                    <p>{complaint.service.name}</p>
                  </div>
                )}

                {complaint.product && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Product</p>
                    <p>{complaint.product.name}</p>
                  </div>
                )}

                {complaint.provider && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Provider</p>
                    <p>{complaint.provider.name}</p>
                  </div>
                )}

                 {complaint.humanitarianOrg && (
                     <div>
                      <p className="text-sm font-medium text-muted-foreground">Humanitarian Organization</p>
                      <p>{complaint.humanitarianOrg.name}</p>
                     </div>
                 )}
              </div>
            </div>

            {/* Assign Complaint Component */}
            {canAssign && (
                 <AssignComplaint
                     complaintId={complaint.id}
                     currentAssignedAgentId={complaint.assignedAgentId}
                     assignableUsers={assignableUsers}
                     canAssign={canAssign}
                     onAssignmentComplete={refresh}
                 />
            )}


            {/* Actions Card (Status Change Buttons) */}
            <div className="bg-card p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Actions</h2>

              <div className="space-y-3">
                 {canChangeStatus && (
                     <div className="grid grid-cols-1 gap-2">
                         <Button
                             variant="outline"
                             className="w-full justify-start"
                             disabled={isChangingStatus || complaint.status === ComplaintStatus.ASSIGNED}
                             onClick={() => handleChangeStatus(ComplaintStatus.ASSIGNED)}
                         >
                             Assign
                         </Button>

                         <Button
                             variant="outline"
                             className="w-full justify-start"
                             disabled={isChangingStatus || complaint.status === ComplaintStatus.IN_PROGRESS}
                             onClick={() => handleChangeStatus(ComplaintStatus.IN_PROGRESS)}
                         >
                             Mark as In Progress
                         </Button>

                         <Button
                             variant="outline"
                             className="w-full justify-start"
                             disabled={isChangingStatus || complaint.status === ComplaintStatus.RESOLVED}
                             onClick={() => handleChangeStatus(ComplaintStatus.RESOLVED)}
                         >
                             Mark as Resolved
                         </Button>

                         <Button
                             variant="outline"
                             className="w-full justify-start"
                             disabled={isChangingStatus || complaint.status === ComplaintStatus.CLOSED}
                             onClick={() => handleChangeStatus(ComplaintStatus.CLOSED)}
                         >
                             Close Complaint
                         </Button>

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
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    );
}