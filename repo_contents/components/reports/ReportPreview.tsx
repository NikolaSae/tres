// components/reports/ReportPreview.tsx
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ReportPreviewProps {
  reportId?: string;
  reportType: string;
  reportName: string;
  reportData?: any;
  isLoading?: boolean;
  onDownload?: () => void;
  onPrint?: () => void;
  previewImageUrl?: string; // Optional URL to preview image
  previewHtml?: string; // Optional HTML content for preview
}

export function ReportPreview({
  reportId,
  reportType,
  reportName,
  reportData,
  isLoading = false,
  onDownload,
  onPrint,
  previewImageUrl,
  previewHtml,
}: ReportPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1); // This would be dynamic based on report
  const [previewMode, setPreviewMode] = useState<"visual" | "data">("visual");
  
  // Navigate between pages for multi-page reports
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-muted/20">
        <h3 className="text-lg font-medium">{reportName}</h3>
        <div className="flex items-center gap-2">
          <Tabs
            defaultValue="visual"
            value={previewMode}
            onValueChange={(value) => setPreviewMode(value as "visual" | "data")}
            className="w-[200px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visual">Visual</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onPrint}
            disabled={isLoading || !onPrint}
          >
            <Printer size={16} className="mr-2" />
            Print
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDownload}
            disabled={isLoading || !onDownload}
          >
            <Download size={16} className="mr-2" />
            Download
          </Button>
        </div>
      </div>
      
      <div className={cn(
        "p-4 min-h-[500px] flex flex-col",
        isLoading && "items-center justify-center"
      )}>
        {isLoading ? (
          <div className="space-y-4 w-full max-w-3xl">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-20 w-3/4" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            {previewMode === "visual" && (
              <div className="flex-1 flex flex-col items-center justify-center">
                {previewImageUrl ? (
                  <img 
                    src={previewImageUrl} 
                    alt={`Preview of ${reportName}`} 
                    className="max-w-full max-h-[600px] object-contain"
                  />
                ) : previewHtml ? (
                  <div 
                    className="w-full h-full" 
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    <p>No preview available for this report type.</p>
                    <p className="text-sm mt-2">Generate the report to view the contents.</p>
                  </div>
                )}
              </div>
            )}
            
            {previewMode === "data" && (
              <div className="flex-1 overflow-auto">
                {reportData ? (
                  <pre className="whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(reportData, null, 2)}
                  </pre>
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    <p>No data preview available.</p>
                    <p className="text-sm mt-2">Generate the report to view the data.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t p-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={prevPage}
            disabled={currentPage === 1 || isLoading}
          >
            <ChevronLeft size={16} className="mr-2" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={nextPage}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
            <ChevronRight size={16} className="ml-2" />
          </Button>
        </div>
      )}
    </Card>
  );
}