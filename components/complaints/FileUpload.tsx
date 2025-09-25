// /components/complaints/FileUpload.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Attachment } from "@prisma/client";
import { Upload, X, FileIcon, FileText } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  complaintId?: string;
  existingAttachments?: Attachment[];
}

// KLJUČNA IZMENA: Menjamo default export u named export
export function FileUpload({
  complaintId,
  existingAttachments = []
}: FileUploadProps) {
  const router = useRouter();
  // const { toast } = useToast();

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!complaintId || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);

      const response = await fetch(`/api/complaints/${complaintId}/attachments`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload files");
      }

      setUploadProgress(100);
      setFiles([]);
      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });

      setTimeout(() => {
        setUploadProgress(0);
        setUploading(false);
        router.refresh();
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      });
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      window.open(attachment.fileUrl, "_blank");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const deleteAttachment = async (attachmentId: string) => {
    if (!complaintId) return;

    try {
      const response = await fetch(`/api/complaints/${complaintId}/attachments/${attachmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete file");
      }

      toast({
        title: "Success",
        description: "File deleted successfully",
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        onChange={handleFileChange}
      />

      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Attachments</h3>
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Select Files
          </Button>
        </div>

        <div className="border rounded-md p-4 space-y-2">
          {existingAttachments.length === 0 && files.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No attachments yet</p>
              <p className="text-xs">Upload files to attach to this complaint</p>
            </div>
          ) : (
            <>
              {/* Existing attachments */}
              {existingAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-2 border rounded bg-muted/50"
                >
                  <div className="flex items-center space-x-2">
                    <FileIcon className="h-4 w-4" />
                    <span className="text-sm truncate max-w-[200px]">
                      {attachment.fileName}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => downloadAttachment(attachment)}
                    >
                      <span className="sr-only">Download</span>
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => deleteAttachment(attachment.id)}
                      disabled={uploading}
                    >
                      <span className="sr-only">Delete</span>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Fajlovi za upload */}
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded bg-accent/50"
                >
                  <div className="flex items-center space-x-2">
                    <FileIcon className="h-4 w-4" />
                    <span className="text-sm truncate max-w-[200px]">
                      {file.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                  >
                    <span className="sr-only">Remove</span>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </>
          )}

          {/* Uslovno renderovanje progress bara kada je upload u toku */}
          {uploadProgress > 0 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Dugme za pokretanje uploada ako su fajlovi selektovani i nije već u toku */}
          {files.length > 0 && !uploading && (
            <Button
              onClick={uploadFiles}
              className="w-full"
            >
              Upload Files
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}