// components/reports/HumanitarianFileUploader.tsx
"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, Info } from "lucide-react";
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
  reportType?: 'prepaid' | 'postpaid';
  isMonthlyReport?: boolean;
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

  const parseFileName = useCallback((fileName: string, file: File): ParsedFileInfo => {
    try {
      let kratkiBroj = "";
      let startDate = "";
      let endDate = "";
      let isMonthlyReport = false;

      const specialOrganizations: Record<string, string> = {
        'Nurdor': '1150',
        'Akton': '1150',
        // dodaj po potrebi
      };

      const isPostpaidFile = fileName.startsWith('Postpaid_') || fileName.startsWith('SDP_');
      const isPrepaidFile = fileName.startsWith('Servis_');
      const reportType: 'prepaid' | 'postpaid' = isPostpaidFile ? 'postpaid' : 'prepaid';

      // -------------------- DATUM --------------------
      const dateMatch = fileName.match(/_(\d{8})__/)
                     || fileName.match(/_(\d{8})\.xls?$/i)
                     || fileName.match(/(\d{8})(?:__\w+)?\.xls?$/i);

      if (!dateMatch) {
        return { file, kratkiBroj: "", startDate: "", endDate: "", fileName, folderPath: "", isValid: false, error: "Datumi nisu pronađeni u imenu fajla" };
      }

      const [, singleDate] = dateMatch;
      const year = singleDate.slice(0, 4);
      const month = singleDate.slice(4, 6);
      const day = singleDate.slice(6, 8);

      if (day === '01') {
        startDate = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
        isMonthlyReport = true;
      } else {
        startDate = `${year}-${month}-${day}`;
        endDate = `${year}-${month}-${day}`;
      }

      // -------------------- KRATKI BROJ --------------------
      for (const [orgName, orgNumber] of Object.entries(specialOrganizations)) {
        if (fileName.includes(orgName)) {
          kratkiBroj = orgNumber;
          break;
        }
      }

      if (!kratkiBroj) {
        if (isPostpaidFile) {
          // SDP_ postpaid
          let numberMatch = fileName.match(/SDP_.*_(\d{4})_\d{8}/);
          if (numberMatch) kratkiBroj = numberMatch[1];

          // Postpaid_Tracking_Humanitarni format
          if (!kratkiBroj) {
            numberMatch = fileName.match(/Postpaid_Tracking_H\w*aitarni_(\d{4})/);
            if (numberMatch) kratkiBroj = numberMatch[1];
          }
        }

        if (isPrepaidFile) {
          // Servis_ prepaid
          let numberMatch = fileName.match(/Servis__SDP_.*_Humanitarni_(\d{4})/);
          if (numberMatch) kratkiBroj = numberMatch[1];
        }

        // Fallback: bilo koji 4-cifreni broj koji nije godina
        if (!kratkiBroj) {
          const currentYear = new Date().getFullYear().toString();
          const allNumbers = fileName.match(/\d{4}/g);
          if (allNumbers) {
            for (const num of allNumbers) {
              if (num !== currentYear) {
                kratkiBroj = num;
                break;
              }
            }
          }
        }
      }

      if (!kratkiBroj) {
        return { file, kratkiBroj: "", startDate, endDate, fileName, folderPath: "", isValid: false, error: "Kratki broj organizacije nije pronađen u imenu fajla" };
      }

      const folderPath = `${year}/${month}/${reportType}`;

      return { file, kratkiBroj, startDate, endDate, fileName, folderPath, isValid: true, reportType, isMonthlyReport };

    } catch (error) {
      return {
        file,
        kratkiBroj: "",
        startDate: "",
        endDate: "",
        fileName,
        folderPath: "",
        isValid: false,
        error: `Greška pri parsiranju imena fajla: ${error instanceof Error ? error.message : 'Nepoznata greška'}`
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

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

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
        const orgResponse = await fetch(`/api/organizations/by-kratki-broj/${fileInfo.kratkiBroj}`);
        if (!orgResponse.ok) {
          results.push({ fileName: fileInfo.fileName, success: false, error: `Organizacija sa kratkim brojem ${fileInfo.kratkiBroj} nije pronađena` });
          continue;
        }

        const organization = await orgResponse.json();
        const formData = new FormData();
        formData.append('file', fileInfo.file);
        formData.append('organizationId', organization.id);
        formData.append('folderPath', fileInfo.folderPath);
        formData.append('startDate', fileInfo.startDate);
        formData.append('endDate', fileInfo.endDate);

        const uploadResponse = await fetch('/api/reports/upload-humanitarian', { method: 'POST', body: formData });

        if (uploadResponse.ok) {
          results.push({ fileName: fileInfo.fileName, success: true, organizationId: organization.id, organizationName: organization.name });
        } else {
          const error = await uploadResponse.text();
          results.push({ fileName: fileInfo.fileName, success: false, error: error || 'Greška pri upload-u' });
        }
      } catch {
        results.push({ fileName: fileInfo.fileName, success: false, error: 'Mrežna greška' });
      }

      setUploadProgress(((i + 1) / validFiles.length) * 100);
    }

    setUploadResults(results);
    setUploading(false);
    setFiles(prev => prev.filter(f => !results.some(r => r.fileName === f.fileName && r.success)));
  };

  const validFiles = files.filter(f => f.isValid);
  const invalidFiles = files.filter(f => !f.isValid);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Upload Humanitarian Reports</CardTitle>
          <CardDescription>
            Upload XLS/XLSX fajlove sa izvještajima humanitarnih organizacija. Sistem podržava različite formate imena fajlova i automatski sortira po organizacijama i datumima.
          </CardDescription>
        </CardHeader>
        <CardContent>
  <Alert className="mb-4">
    <Info className="h-4 w-4" />
    <AlertDescription>
      <strong>Podržani formati fajlova (POBOLJŠANA DETEKCIJA):</strong><br/>
      • <span className="text-blue-600">Prepaid izveštaji:</span> počinju sa <code>Servis_</code><br/>
      • <span className="text-green-600">Postpaid izveštaji:</span> počinju sa <code>Postpaid_</code> ili <code>SDP_</code><br/>
      • <span className="text-purple-600">Novi format:</span> <code>Postpaid_Tracking_Humanitarni_BROJNaziv_dodatni_datum__</code><br/>
      • <span className="text-orange-600">Specijalne organizacije:</span> identifikacija po nazivu (npr. Nurdor/Akton → 1150)<br/>
      • <span className="text-gray-600">Format datuma:</span> YYYYMMDD u nazivu fajla
    </AlertDescription>
  </Alert>
  
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
                      Period: {fileInfo.startDate} - {fileInfo.endDate}
                      {fileInfo.isMonthlyReport && <span className="text-purple-600 font-medium"> (Mesečni izveštaj)</span>} | 
                      Folder: /reports/{fileInfo.kratkiBroj} - [ime_organizacije]/{fileInfo.folderPath}
                      {fileInfo.reportType === 'prepaid' && (
                        <span className="text-blue-600 font-medium"> (Prepaid)</span>
                      )}
                      {fileInfo.reportType === 'postpaid' && (
                        <span className="text-green-600 font-medium"> (Postpaid)</span>
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
                  <FileSpreadsheet className="h-4 w-4 text-red-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileInfo.fileName}</p>
                    {fileInfo.error && (
                      <p className="text-xs text-red-600">{fileInfo.error}</p>
                    )}
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

      <div className="mt-4">
        <Button 
          onClick={uploadFiles} 
          disabled={uploading || validFiles.length === 0}
          className="w-full"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {uploading ? `Uploading... (${Math.round(uploadProgress)}%)` : 'Upload Valid Files'}
        </Button>
      </div>
    </div>
  )}

  {/* === Loading bar i rezultati uvek vidljivi, nezavisno od files === */}
  {uploading && (
    <Progress value={uploadProgress} className="mt-4" />
  )}

  {uploadResults.length > 0 && (
    <div className="mt-4 space-y-2">
      {uploadResults.map((result, index) => (
        <Alert 
          key={index} 
          variant={result.success ? "success" : "destructive"}
          className="flex items-center gap-2"
        >
          {result.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className="flex-1">
            {result.success ? (
              <>
                <strong>{result.fileName}</strong> uploaded successfully for organization: {result.organizationName} ({result.organizationId})
              </>
            ) : (
              <>
                <strong>{result.fileName}</strong> failed to upload. {result.error}
              </>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )}
</CardContent>
      </Card>
    </div>
  );
}
