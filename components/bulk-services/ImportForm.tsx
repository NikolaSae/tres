///components/bulk-services/ImportForm.tsx

"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, FileText, Upload, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { importBulkServicesFromCsv } from "@/actions/bulk-services/import";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulkServiceImportResult } from "@/lib/types/bulk-service-types";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table"; // Dodajte ove import-e ako nedostaju

interface ImportFormProps {
  onSuccess?: (count: number) => void;
  onCancel?: () => void;
}

export function ImportForm({ onSuccess, onCancel }: ImportFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importStats, setImportStats] = useState({ 
    imported: 0, 
    failed: 0, 
    errors: 0, 
    errorDetails: [] as BulkServiceImportResult['invalidRows'],
    createdServices: [] as { id: string; name: string }[],
    // createdProviders: [] as { id: string; name: string }[] // UKLONJENO: Nema više stanja za provajdere
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Reset states
    setError(null);
    setImportSuccess(false);
    setPreviewData([]);
    setImportStats({ imported: 0, failed: 0, errors: 0, errorDetails: [], createdServices: [] /*, createdProviders: []*/ }); // Resetuj
    
    // Check file type
    if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith('.csv')) {
      setError("Please upload a valid CSV file");
      return;
    }
    
    setFile(selectedFile);
    
    // Preview the file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const lines = csvText.split('\n').filter(line => line.trim());
        
        // Extract header and a few rows for preview
        if (lines.length === 0) {
            setError("CSV file is empty.");
            return;
        }
        const headers = lines[0].split(',').map(h => h.trim());
        const previewRows = lines.slice(1, 6).map(line => 
          line.split(',').map(cell => cell.trim())
        );
        
        // Validate required columns
        const requiredColumns = [
          "provider_name", 
          "agreement_name", 
          "service_name", 
          "step_name", 
          "sender_name", 
          "requests", 
          "message_parts"
        ];
        
        const missingColumns = requiredColumns.filter(col => 
          !headers.map(h => h.toLowerCase()).includes(col.toLowerCase())
        );
        
        if (missingColumns.length > 0) {
          setError(`Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }
        
        setPreviewData([headers, ...previewRows]);
      } catch (err) {
        setError("Error reading CSV file. Please ensure it's correctly formatted");
        console.error(err);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setProgress(0);
    setError(null);
    setImportStats({ imported: 0, failed: 0, errors: 0, errorDetails: [], createdServices: [] /*, createdProviders: []*/ }); // Resetuj
    
    try {
      const csvContent = await file.text();

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 300);
      
      const result: BulkServiceImportResult = await importBulkServicesFromCsv(csvContent);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (result.error) {
        setError(result.error);
        setImportStats({
          imported: result.createdCount || 0,
          failed: result.invalidRows.length || 0,
          errors: (result.invalidRows.length || 0) + (result.importErrors.length || 0),
          errorDetails: result.invalidRows,
          createdServices: result.createdServices || [],
          // createdProviders: result.createdProviders || [] // UKLONJENO
        });
      } else {
        setImportSuccess(true);
        setImportStats({
          imported: result.createdCount || 0,
          failed: result.invalidRows.length || 0,
          errors: (result.invalidRows.length || 0) + (result.importErrors.length || 0),
          errorDetails: result.invalidRows,
          createdServices: result.createdServices || [],
          // createdProviders: result.createdProviders || [] // UKLONJENO
        });
        
        if (onSuccess) {
          onSuccess(result.createdCount || 0);
        }
        
        toast.success(`Import completed! Imported: ${result.createdCount}, Failed: ${result.invalidRows.length}, New Services: ${result.createdServices?.length || 0}`); // Prilagođena poruka
      }
    } catch (err) {
      setError(`Error importing data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setError(null);
    setPreviewData([]);
    setImportSuccess(false);
    setProgress(0);
    setImportStats({ imported: 0, failed: 0, errors: 0, errorDetails: [], createdServices: [] /*, createdProviders: []*/ }); // Resetuj
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Import Bulk Services</CardTitle>
        <CardDescription>
          Upload a CSV file containing bulk services data to import into the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {importSuccess || (error && importStats.errors > 0) ? (
          <div className="space-y-4">
            {importSuccess && (
              <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle>Import completed</AlertTitle>
                <AlertDescription>
                  Successfully imported bulk services data into the system.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Imported</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{importStats.imported}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{importStats.failed}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{importStats.errors}</div>
                </CardContent>
              </Card>
            </div>

            {/* UKLONJENO: Nema više prikaza novokreiranih provajdera
            {importStats.createdProviders && importStats.createdProviders.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-lg font-semibold mb-2">New Providers Created:</h4>
                    <div className="flex flex-wrap gap-2">
                        {importStats.createdProviders.map((provider) => (
                            <Badge key={provider.id} variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                {provider.name}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
            */}

            {importStats.createdServices && importStats.createdServices.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-lg font-semibold mb-2">New Services Created:</h4>
                    <div className="flex flex-wrap gap-2">
                        {importStats.createdServices.map((service) => (
                            <Badge key={service.id} variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {service.name}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {importStats.errorDetails && importStats.errorDetails.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-lg font-semibold mb-2">Error Details:</h4>
                    <div className="border rounded-md max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-red-50 dark:bg-red-900/20">
                                    <th className="text-left p-2 font-medium">Row</th>
                                    <th className="text-left p-2 font-medium">Error</th>
                                    <th className="text-left p-2 font-medium">Original Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importStats.errorDetails.map((detail, index) => (
                                    <TableRow key={index} className="border-t hover:bg-red-50 dark:hover:bg-red-900/10">
                                        <TableCell className="p-2">{detail.rowIndex === -1 ? 'N/A' : detail.rowIndex + 2}</TableCell>
                                        <TableCell className="p-2 text-red-700 dark:text-red-300">{detail.errors.join('; ')}</TableCell>
                                        <TableCell className="p-2 text-xs text-muted-foreground">
                                            {detail.originalRow ? JSON.stringify(detail.originalRow) : 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={resetForm}>
                Import Another File
              </Button>
              <Button onClick={() => onCancel?.()}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <>
            {file ? (
              <Tabs defaultValue="preview">
                <TabsList className="mb-4">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="file">File Info</TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview">
                  {previewData.length > 0 ? (
                    <div className="border rounded-md overflow-auto max-h-64">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted">
                            {previewData[0].map((header, i) => (
                              <th key={i} className="text-left p-2 text-xs font-medium text-muted-foreground">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.slice(1).map((row, i) => (
                            <tr key={i} className="border-t">
                              {row.map((cell, j) => (
                                <td key={j} className="p-2 text-xs">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      Preview data not available
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="file">
                  <div className="space-y-4">
                    <div className="flex items-center p-4 border rounded-md bg-muted/30">
                      <FileText className="h-8 w-8 mr-3 text-primary" />
                      <div className="space-y-1">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB · {file.type || "CSV File"}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="ml-auto" 
                        onClick={resetForm}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Import validation successful</AlertTitle>
                      <AlertDescription>
                        The file structure has been validated. You can now proceed with the import.
                      </AlertDescription>
                    </Alert>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed rounded-md">
                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">Upload a CSV file</h3>
                <p className="text-sm text-muted-foreground text-center max-w-xs mt-1 mb-6">
                  The CSV file should contain provider_name, agreement_name, service_name, step_name, 
                  sender_name, requests, and message_parts columns.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  Select CSV File
                </Button>
              </div>
            )}
            
            {isUploading && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Importing...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </>
        )}
      </CardContent>
      {file && !importSuccess && !isUploading && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={resetForm}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!previewData.length || !!error}>
            Import Data
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default ImportForm;
