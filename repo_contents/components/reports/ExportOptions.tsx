///components/reports/ExportOptions.tsx

"use client";

import { useState } from "react";
import { Check, Download, FileSpreadsheet, FileText, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export type ExportFormat = "excel" | "pdf" | "csv";

interface ExportOptionsProps {
  onExport: (format: ExportFormat) => Promise<void>;
  disabled?: boolean;
  allowedFormats?: ExportFormat[];
}

export function ExportOptions({
  onExport,
  disabled = false,
  allowedFormats = ["excel", "csv", "pdf"],
}: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExport = async (format: ExportFormat) => {
    if (isExporting) return;
    
    setIsExporting(true);
    toast.loading(`Preparing ${format.toUpperCase()} export...`);
    
    try {
      await onExport(format);
      toast.success(`${format.toUpperCase()} export successful`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please try again later.");
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled || isExporting}
          className="flex items-center gap-2"
        >
          <Download size={16} />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {allowedFormats.includes("excel") && (
          <DropdownMenuItem 
            onClick={() => handleExport("excel")}
            disabled={isExporting}
            className="cursor-pointer"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
            Excel (.xlsx)
          </DropdownMenuItem>
        )}
        {allowedFormats.includes("csv") && (
          <DropdownMenuItem 
            onClick={() => handleExport("csv")}
            disabled={isExporting}
            className="cursor-pointer"
          >
            <FileText className="mr-2 h-4 w-4 text-blue-600" />
            CSV File
          </DropdownMenuItem>
        )}
        {allowedFormats.includes("pdf") && (
          <DropdownMenuItem 
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
            className="cursor-pointer"
          >
            <Share2 className="mr-2 h-4 w-4 text-red-600" />
            PDF Document
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}