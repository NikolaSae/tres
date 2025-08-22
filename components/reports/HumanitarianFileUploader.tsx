// components/reports/HumanitarianFileUploader.tsx

"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface ParsedFileInfo {
  file: File;
  kratkiBroj: string;
  startDate: string;
  endDate: string;
  fileName: string;
  folderPath: string;
  isValid: boolean;
  error?: string;
}

interface UploadResult {
  fileName: string;
  success: boolean;
  error?: string;
  organizationId?: string;
  organizationName?: string;
}

export function HumanitarianFileUploader() {
  const [files, setFiles] = useState<ParsedFileInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);

  // Parse filename to extract kratki_broj and dates
  const parseFileName = useCallback((fileName: string, file: File): ParsedFileInfo => {
    try {
      // Support multiple formats:
      // Format 1: Servis__MicropaymentMerchantReport_SDP *****Humanitarni*****5800_FondacijaMisirlic_1385__20250501_0000__20250531_2359.xls
      // Format 2: Servis__MicropaymentMerchantReport_SDP_Humanitarni_3023 FondacijaHerojiBGmaratona_1420__20250501_0000__20250531_2359.xls
      
      // First extract dates (common pattern)
      const dateRegex = /__(\d{8})_\d{4}__(\d{8})_\d{4}/;
      const dateMatch = fileName.match(dateRegex);
      
      if (!dateMatch) {
        return {
          file,
          kratkiBroj: "",
          startDate: "",
          endDate: "",
          fileName,
          folderPath: "",
          isValid: false,
          error: "Datumi nisu pronađeni u imenu fajla"
        };
      }

      const [, startDate, endDate] = dateMatch;
      
      // Now extract kratki_broj - try different patterns
      let kratkiBroj = "";
      
      // Pattern 1: *****Humanitarni*****NUMBER_
      let numberMatch = fileName.match(/\*+Humanitarni\*+(\d+)_/);
      if (numberMatch) {
        kratkiBroj = numberMatch[1];
      }
      
      // Pattern 2: _Humanitarni_NUMBER (space or underscore after)
      if (!kratkiBroj) {
        numberMatch = fileName.match(/_Humanitarni_(\d+)[\s_]/);
        if (numberMatch) {
          kratkiBroj = numberMatch[1];
        }
      }
      
      // Pattern 3: Just any number followed by underscore before double underscore (fallback)
      if (!kratkiBroj) {
        // Look for pattern: NUMBER_SomeName_ANOTHERNUMBER__DATE
        // We want the first number after _Humanitarni or similar patterns
        const parts = fileName.split('_');
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].includes('Humanitarni') && i + 1 < parts.length) {
            const nextPart = parts[i + 1];
            const numMatch = nextPart.match(/(\d+)/);
            if (numMatch) {
              kratkiBroj = numMatch[1];
              break;
            }
          }
        }
      }

      if (!kratkiBroj) {
        return {
          file,
          kratkiBroj: "",
          startDate: "",
          endDate: "",
          fileName,
          folderPath: "",
          isValid: false,
          error: "Kratki broj organizacije nije pronađen u imenu fajla"
        };
      }
      
      
      // Convert date format from YYYYMMDD to YYYY-MM-DD for easier processing
      const formattedStartDate = `${startDate.slice(0, 4)}-${startDate.slice(4, 6)}-${startDate.slice(6, 8)}`;
      const formattedEndDate = `${endDate.slice(0, 4)}-${endDate.slice(4, 6)}-${endDate.slice(6, 8)}`;
      
      // Extract year and month for folder structure
      const year = startDate.slice(0, 4);
      const month = startDate.slice(4, 6);
      
      // Check if this is a MicropaymentMerchantReport (goes to prepaid subfolder)
      const isPrepaidReport = fileName.includes('MicropaymentMerchantReport');
      const folderPath = isPrepaidReport ? `${year}/${month}/prepaid` : `${year}/${month}`;
      
      return {
        file,
        kratkiBroj,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        fileName,
        folderPath,
        isValid: true
      };
    } catch (error) {
      return {
        file,
        kratkiBroj: "",
        startDate: "",
        endDate: "",
        fileName,
        folderPath: "",
        isValid: false,
        error: "Greška pri parsiranju imena fajla."
      };
    }
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const parsedFiles = acceptedFiles.map(file => parseFileName(file.name, file));
    setFiles(prev => [...prev, ...parsedFiles]);
  }, [parseFileName]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadResults([]);

    const validFiles = files.filter(f => f.isValid);
    const results: UploadResult[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const fileInfo = validFiles[i];
      
      try {
        // First, get organization ID by kratki_broj
        const orgResponse = await fetch(`/api/organizations/by-kratki-broj/${fileInfo.kratkiBroj}`);
        
        if (!orgResponse.ok) {
          results.push({
            fileName: fileInfo.fileName,
            success: false,
            error: `Organizacija sa kratkim brojem ${fileInfo.kratkiBroj} nije pronađena`
          });
          continue;
        }

        const organization = await orgResponse.json();
        
        // Prepare FormData
        const formData = new FormData();
        formData.append('file', fileInfo.file);
        formData.append('organizationId', organization.id);
        formData.append('folderPath', fileInfo.folderPath);
        formData.append('startDate', fileInfo.startDate);
        formData.append('endDate', fileInfo.endDate);

        // Upload file
        const uploadResponse = await fetch('/api/reports/upload-humanitarian', {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          results.push({
            fileName: fileInfo.fileName,
            success: true,
            organizationId: organization.id,
            organizationName: organization.name
          });
        } else {
          const error = await uploadResponse.text();
          results.push({
            fileName: fileInfo.fileName,
            success: false,
            error: error || 'Greška pri upload-u'
          });
        }
      } catch (error) {
        results.push({
          fileName: fileInfo.fileName,
          success: false,
          error: 'Mrežna greška'
        });
      }

      setUploadProgress(((i + 1) / validFiles.length) * 100);
    }

    setUploadResults(results);
    setUploading(false);
    
    // Clear successfully uploaded files
    setFiles(prev => prev.filter(f => 
      !results.some(r => r.fileName === f.fileName && r.success)
    ));
  };

  const validFiles = files.filter(f => f.isValid);
  const invalidFiles = files.filter(f => !f.isValid);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Humanitarian Reports
          </CardTitle>
          <CardDescription>
            Upload XLS/XLSX fajlove sa izvještajima humanitarnih organizacija. 
            Fajlovi će biti automatski sortirani po organizacijama i datumima.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {isDragActive ? (
              <p>Otpustite fajlove ovde...</p>
            ) : (
              <div>
                <p className="mb-1">Povucite i otpustite XLS/XLSX fajlove ovde</p>
                <p className="text-sm text-muted-foreground">ili kliknite da izaberete fajlove</p>
              </div>
            )}
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              {validFiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-green-600">
                    Validni fajlovi ({validFiles.length})
                  </h4>
                  <div className="space-y-2">
                    {validFiles.map((fileInfo, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 flex-1">
                          <FileSpreadsheet className="h-4 w-4 text-green-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{fileInfo.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              Organizacija: {fileInfo.kratkiBroj} | 
                              Period: {fileInfo.startDate} - {fileInfo.endDate} | 
                              Folder: /reports/{fileInfo.kratkiBroj} - [ime_organizacije]/{fileInfo.folderPath}
                              {fileInfo.fileName.includes('MicropaymentMerchantReport') && (
                                <span className="text-blue-600 font-medium"> (Prepaid)</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeFile(files.indexOf(fileInfo))}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {invalidFiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-red-600">
                    Neispravni fajlovi ({invalidFiles.length})
                  </h4>
                  <div className="space-y-2">
                    {invalidFiles.map((fileInfo, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 flex-1">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{fileInfo.fileName}</p>
                            <p className="text-xs text-red-600">{fileInfo.error}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeFile(files.indexOf(fileInfo))}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setFiles([])}
                  disabled={uploading}
                >
                  Obriši sve
                </Button>
                <Button 
                  onClick={uploadFiles}
                  disabled={validFiles.length === 0 || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {validFiles.length} fajl{validFiles.length !== 1 ? 'ova' : ''}
                    </>
                  )}
                </Button>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Upload progress</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </div>
          )}

          {uploadResults.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Upload rezultati</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uploadResults.map((result, index) => (
                  <Alert key={index} className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription className="flex-1">
                        <span className="font-medium">{result.fileName}</span>
                        {result.success ? (
                          <span className="text-green-600 ml-2">
                            ✓ Uspešno uploadovan u {result.organizationName || 'organizacija'}
                          </span>
                        ) : (
                          <span className="text-red-600 ml-2">✗ {result.error}</span>
                        )}
                      </AlertDescription>
                    </div>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}