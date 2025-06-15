// components/complaints/CsvImport.tsx

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { importComplaints } from "@/actions/complaints/import";

interface CsvImportProps {
  onClose: () => void;
  onComplete: (success: boolean, message: string) => void;
}

export function CsvImport({ onClose, onComplete }: CsvImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) return;
    
    // Validate file type
    if (!selectedFile.name.endsWith('.csv')) {
      setValidationStatus({
        isValid: false,
        message: "Invalid file format. Please select a CSV file."
      });
      return;
    }
    
    setFile(selectedFile);
    setValidationStatus(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files?.[0];
    
    if (!droppedFile) return;
    
    if (!droppedFile.name.endsWith('.csv')) {
      setValidationStatus({
        isValid: false,
        message: "Invalid file format. Please select a CSV file."
      });
      return;
    }
    
    setFile(droppedFile);
    setValidationStatus(null);
  };

  const handleImport = async () => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await importComplaints(formData);
      
      if (result.success) {
        onComplete(true, `Successfully imported ${result.importedCount || 0} complaints`);
      } else {
        onComplete(false, result.message || "Import failed");
      }
    } catch (error) {
      console.error("Import error:", error);
      onComplete(false, "Failed to process the CSV file. Please check the format and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold">Import Complaints</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <div 
            className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            
            {file ? (
              <div className="flex flex-col items-center">
                <FileSpreadsheet className="h-12 w-12 text-green-500 mb-2" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-12 w-12 text-gray-400 mb-2" />
                <p className="font-medium">Drop your CSV file here or click to browse</p>
                <p className="text-sm text-gray-500">
                  Only CSV files are supported
                </p>
              </div>
            )}
          </div>
          
          {validationStatus && (
            <div className={`mt-3 p-3 rounded-md flex items-start ${
              validationStatus.isValid ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {validationStatus.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              )}
              <p className={validationStatus.isValid ? 'text-green-700' : 'text-red-700'}>
                {validationStatus.message}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!file || isUploading}
          >
            {isUploading ? "Importing..." : "Import"}
          </Button>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          <p className="font-medium">Expected CSV format:</p>
          <p>service_id, provider_id, subject, description, priority, reported_date</p>
          <p className="mt-1">Need a template? <a href="#" className="text-blue-600 hover:underline">Download sample CSV</a></p>
        </div>
      </div>
    </div>
  );
}