///components/contracts/AttachmentUpload.tsx

"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAttachment } from "@/actions/contracts/add-attachment";
import { useToast } from "@/components/ui/use-toast";

interface AttachmentUploadProps {
  contractId: string;
  onUploadComplete?: () => void;
}

export function AttachmentUpload({ contractId, onUploadComplete }: AttachmentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) return;

    try {
      setUploading(true);
      
      // Create FormData for the file upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("contractId", contractId);
      formData.append("name", file.name);
      formData.append("fileType", file.type);
      
      // Call the server action
      const result = await addAttachment(formData);
      
      if (result.success) {
        toast({
          title: "Attachment uploaded",
          description: "Your file has been uploaded successfully",
        });
        
        // Reset the file input
        setFile(null);
        
        // Callback to refresh the attachments list
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        toast({
          title: "Upload failed",
          description: result.error || "There was an error uploading your file",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      });
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Upload attachment</Label>
          <div className="flex items-center gap-2">
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="flex-1"
              disabled={uploading}
            />
            {file && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleRemoveFile}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {file && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Selected file:</span>
            <span>{file.name}</span>
            <span className="text-muted-foreground">({(file.size / 1024).toFixed(2)} KB)</span>
          </div>
        )}
        
        <Button 
          type="submit" 
          disabled={!file || uploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload Attachment"}
        </Button>
      </form>
    </div>
  );
}