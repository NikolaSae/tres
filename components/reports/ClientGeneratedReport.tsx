"use client";

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Download, Printer } from "lucide-react";

interface Props {
  fileUrl: string;
  fileName: string;
}

export const ClientGeneratedReport: FC<Props> = ({ fileUrl, fileName }) => {
  const handlePreview = () => {
    const previewWindow = window.open(fileUrl, "_blank");
    if (previewWindow) previewWindow.document.title = fileName;
  };

  const handlePrint = () => {
    const printWindow = window.open(fileUrl, "_blank");
    if (printWindow) printWindow.onload = () => printWindow.print();
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={handlePreview} className="flex items-center gap-1">
        <Eye className="h-3 w-3" /> Preview
      </Button>

      <Button size="sm" asChild variant="outline">
        <a href={fileUrl} download={fileName} className="flex items-center gap-1">
          <Download className="h-3 w-3" /> Download
        </a>
      </Button>

      <Button size="sm" variant="outline" onClick={handlePrint} className="flex items-center gap-1">
        <Printer className="h-3 w-3" /> Print
      </Button>
    </div>
  );
};
