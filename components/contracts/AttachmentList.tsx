///components/contracts/AttachmentList.tsx

"use client";

import { useState } from "react";
import { FileText, Download, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/utils";

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
  attachments: Attachment[];
  contractId: string;
  onDelete?: (attachmentId: string) => Promise<void>;
  canDelete?: boolean;
}

export function AttachmentList({ 
  attachments, 
  contractId, 
  onDelete,
  canDelete = false 
}: AttachmentListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (attachmentId: string) => {
    if (!onDelete) return;
    
    try {
      setDeleting(attachmentId);
      await onDelete(attachmentId);
    } catch (error) {
      console.error("Error deleting attachment:", error);
    } finally {
      setDeleting(null);
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    // Simple file type detection
    if (fileType.includes("pdf")) {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (fileType.includes("image")) {
      return <Eye className="h-4 w-4 text-blue-500" />;
    } else if (fileType.includes("word") || fileType.includes("document")) {
      return <FileText className="h-4 w-4 text-blue-700" />;
    } else if (fileType.includes("excel") || fileType.includes("spreadsheet")) {
      return <FileText className="h-4 w-4 text-green-600" />;
    } else {
      return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  if (attachments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <FileText className="h-10 w-10 mb-2" />
        <p>No attachments for this contract</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Type</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Uploaded By</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attachments.map((attachment) => (
            <TableRow key={attachment.id}>
              <TableCell>
                <div className="flex items-center">
                  {getFileTypeIcon(attachment.fileType)}
                </div>
              </TableCell>
              <TableCell>{attachment.name}</TableCell>
              <TableCell>{attachment.uploadedBy.name}</TableCell>
              <TableCell>{formatDate(attachment.uploadedAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    asChild
                  >
                    <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </a>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    asChild
                  >
                    <a href={attachment.fileUrl} download={attachment.name}>
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </Button>
                  
                  {canDelete && onDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete attachment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this attachment? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(attachment.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleting === attachment.id}
                          >
                            {deleting === attachment.id ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}