// components/contracts/AttachmentList.tsx
"use client";
import { FileIcon, DownloadIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteAttachment } from "@/actions/contracts/delete-attachment";
import { toast } from "sonner";
import { useState } from "react";

interface Attachment {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: Date;
  uploadedBy: {
    name: string;
  };
}

interface AttachmentListProps {
  contractId: string;
  attachments: Attachment[];
  onDelete?: (attachmentId: string) => void;
}

export function AttachmentList({ contractId, attachments, onDelete }: AttachmentListProps) {

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (attachmentId: string) => {
    setDeletingId(attachmentId);
    try {
      const result = await deleteAttachment(contractId, attachmentId);
      if (result.success) {
        toast({
          title: "Attachment deleted",
          description: "Your file has been removed successfully",
        });
        if (onDelete) onDelete(attachmentId);
      } else {
        toast({
          title: "Delete failed",
          description: result.error || "There was an error deleting the file",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "There was an error deleting your file",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileIcon className="text-red-500" />;
    if (fileType.includes('image')) return <FileIcon className="text-blue-500" />;
    if (fileType.includes('word')) return <FileIcon className="text-blue-600" />;
    if (fileType.includes('excel')) return <FileIcon className="text-green-600" />;
    return <FileIcon className="text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // FIXED: Corrected the parentheses issue
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileIcon className="mx-auto h-12 w-12" />
        <p className="mt-2">No attachments found</p>
        <p className="text-sm">Upload files using the form below</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              {getFileIcon(attachment.fileType)}
            </div>
            <div>
              <div className="font-medium text-sm line-clamp-1">{attachment.name}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(attachment.uploadedAt).toLocaleDateString()} • 
                {attachment.uploadedBy?.name || 'Unknown user'}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <a 
              href={attachment.fileUrl} 
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-blue-500 hover:text-blue-700"
            >
              <DownloadIcon className="h-4 w-4" />
            </a>
            <button 
              onClick={() => handleDelete(attachment.id)}
              className="p-2 text-red-500 hover:text-red-700"
              disabled={deletingId === attachment.id}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}