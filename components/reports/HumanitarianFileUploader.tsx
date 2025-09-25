// components/reports/HumanitarianFileUploader.tsx
"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Loader2,
  Info,
  Car,
  Users,
  Building
} from "lucide-react";
import { useDropzone } from "react-dropzone";

interface ParsedFileInfo {
  file: File;
  reportCategory: "humanitarian" | "provider" | "parking" | "unknown";

  // Humanitarian specific
  kratkiBroj?: string;
  organizationId?: string;

  // Provider specific
  providerId?: string;
  providerName?: string;
  serviceType?: string;

  // Parking specific
  cityName?: string;
  parkingProvider?: string;

  startDate: string;
  endDate: string;
  fileName: string;
  folderPath: string;
  isValid: boolean;
  error?: string;
  reportType?: "prepaid" | "postpaid";
  isMonthlyReport?: boolean;
}

interface UploadResult {
  fileName: string;
  success: boolean;
  error?: string;
  organizationId?: string;
  organizationName?: string;
  filePath?: string;
  category: "humanitarian" | "provider" | "parking";
}

export function HumanitarianFileUploader() {
  const [files, setFiles] = useState<ParsedFileInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);

  const parseFileName = useCallback((fileName: string, file: File): ParsedFileInfo => {
    try {
      let startDate = "";
      let endDate = "";
      let isMonthlyReport = false;
      let reportCategory: ParsedFileInfo["reportCategory"] = "unknown";

      const lower = fileName.toLowerCase();
      if (lower.includes("human")) reportCategory = "humanitarian";
      else if (
        fileName.startsWith("Postpaid_Tracking_") &&
        (fileName.includes("_12_") ||
          fileName.includes("_MPNS_") ||
          fileName.includes("_PSC_") ||
          fileName.includes("_Easy_") ||
          fileName.includes("_SynapseTech_") ||
          fileName.includes("_DjS_") ||
          fileName.includes("mParking") ||
          fileName.includes("mTicketing"))
      )
        reportCategory = "parking";
      else if (
        fileName.startsWith("Postpaid_Tracking_") ||
        fileName.startsWith("SDP_") ||
        fileName.startsWith("Servis_")
      )
        reportCategory = "provider";

      // parse date heuristics (keeps previous regexes)
      const dateMatch =
        fileName.match(/_(\d{8})__/) ||
        fileName.match(/__(\d{8})_\d{4}__/) ||
        fileName.match(/_(\d{8})\.xls?$/i) ||
        fileName.match(/(\d{8})(?:__\w+)?\.xls?$/i) ||
        fileName.match(/__(\d{8})_/) ||
        fileName.match(/(\d{8})__/);

      if (!dateMatch) {
        return {
          file,
          reportCategory,
          startDate: "",
          endDate: "",
          fileName,
          folderPath: "",
          isValid: false,
          error: "Datumi nisu pronađeni u imenu fajla"
        };
      }

      const singleDate = dateMatch[1];
      const year = singleDate.slice(0, 4);
      const month = singleDate.slice(4, 6);
      const day = singleDate.slice(6, 8);

      if (day === "01") {
        startDate = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        endDate = `${year}-${month}-${lastDay.toString().padStart(2, "0")}`;
        isMonthlyReport = true;
      } else {
        startDate = `${year}-${month}-${day}`;
        endDate = `${year}-${month}-${day}`;
      }

      // delegate to category-specific parsers
      if (reportCategory === "humanitarian") {
        return parseHumanitarianFile(fileName, file, year, month, startDate, endDate, isMonthlyReport);
      }
      if (reportCategory === "provider") {
        return parseProviderFile(fileName, file, year, month, startDate, endDate, isMonthlyReport);
      }
      if (reportCategory === "parking") {
        return parseParkingFile(fileName, file, year, month, startDate, endDate, isMonthlyReport);
      }

      return {
        file,
        reportCategory,
        startDate,
        endDate,
        fileName,
        folderPath: "",
        isValid: false,
        error: "Nepoznat tip izveštaja"
      };
    } catch (err) {
      return {
        file,
        reportCategory: "unknown",
        startDate: "",
        endDate: "",
        fileName,
        folderPath: "",
        isValid: false,
        error: `Greška pri parsiranju: ${err instanceof Error ? err.message : "Nepoznata greška"}`
      };
    }
  }, []);

  const parseHumanitarianFile = (
    fileName: string,
    file: File,
    year: string,
    month: string,
    startDate: string,
    endDate: string,
    isMonthlyReport: boolean
  ): ParsedFileInfo => {
    let kratkiBroj = "";
    const specialOrganizations: Record<string, string> = { Nurdor: "1150", Unicef: "9656" };

    for (const [name, num] of Object.entries(specialOrganizations)) {
      if (fileName.includes(name)) {
        kratkiBroj = num;
        break;
      }
    }

    // fallback: first 4-digit occurence that is not current year / 0000 etc.
    if (!kratkiBroj) {
      const all4 = fileName.match(/\d{4}/g) || [];
      const curr = new Date().getFullYear().toString();
      for (const n of all4) {
        if (n !== curr && n !== "0000" && n !== "2359") {
          kratkiBroj = n;
          break;
        }
      }
    }

    if (!kratkiBroj) {
      return {
        file,
        reportCategory: "humanitarian",
        startDate,
        endDate,
        fileName,
        folderPath: "",
        isValid: false,
        error: "Kratki broj organizacije nije pronađen u imenu fajla"
      };
    }

    const isPostpaid = fileName.toLowerCase().startsWith("postpaid") || fileName.startsWith("SDP_");
    const reportType: "prepaid" | "postpaid" = isPostpaid ? "postpaid" : "prepaid";
    const folderPath = `${year}/${month}/${reportType}`;

    return {
      file,
      reportCategory: "humanitarian",
      kratkiBroj,
      startDate,
      endDate,
      fileName,
      folderPath,
      isValid: true,
      reportType,
      isMonthlyReport
    };
  };

  const parseProviderFile = (
    fileName: string,
    file: File,
    year: string,
    month: string,
    startDate: string,
    endDate: string,
    isMonthlyReport: boolean
  ): ParsedFileInfo => {
    let providerName = "";
    let serviceType = "";
    if (fileName.match(/__([^.]+)\.xls?$/i)) {
      providerName = (fileName.match(/__([^.]+)\.xls?$/i) as RegExpMatchArray)[1];
    }
    if (fileName.startsWith("Postpaid_Tracking_")) {
      const m = fileName.match(/Postpaid_Tracking_[^_]+_([^_]+)_/);
      if (m) serviceType = m[1];
    }

    if (!providerName) {
      return {
        file,
        reportCategory: "provider",
        startDate,
        endDate,
        fileName,
        folderPath: "",
        isValid: false,
        error: "Naziv provajdera nije pronađen u imenu fajla"
      };
    }

    const reportType: "prepaid" | "postpaid" = fileName.startsWith("Postpaid_") ? "postpaid" : "prepaid";
    const folderPath = `${year}/${month}/${reportType}/${serviceType || "standard"}`;

    return {
      file,
      reportCategory: "provider",
      providerName,
      serviceType,
      startDate,
      endDate,
      fileName,
      folderPath,
      isValid: true,
      reportType,
      isMonthlyReport
    };
  };

  const parseParkingFile = (
    fileName: string,
    file: File,
    year: string,
    month: string,
    startDate: string,
    endDate: string,
    isMonthlyReport: boolean
  ): ParsedFileInfo => {
    let cityName = "";
    let parkingProvider = "";
    if (fileName.match(/__([^.]+)\.xls?$/i)) parkingProvider = (fileName.match(/__([^.]+)\.xls?$/i) as RegExpMatchArray)[1];
    if (fileName.startsWith("Postpaid_Tracking_")) {
      const m = fileName.match(/Postpaid_Tracking_([^_]+)_/);
      if (m) cityName = m[1];
    }

    if (!parkingProvider) {
      return {
        file,
        reportCategory: "parking",
        startDate,
        endDate,
        fileName,
        folderPath: "",
        isValid: false,
        error: "Parking provajder nije pronađen u imenu fajla"
      };
    }

    if (!cityName) {
      return {
        file,
        reportCategory: "parking",
        startDate,
        endDate,
        fileName,
        folderPath: "",
        isValid: false,
        error: "Naziv grada nije pronađen u imenu fajla"
      };
    }

    const folderPath = `${year}/${month}/parking/${cityName}`;

    return {
      file,
      reportCategory: "parking",
      cityName,
      parkingProvider,
      startDate,
      endDate,
      fileName,
      folderPath,
      isValid: true,
      reportType: "postpaid",
      isMonthlyReport
    };
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const parsed = acceptedFiles.map((f) => parseFileName(f.name, f));
      setFiles((p) => [...p, ...parsed]);
    },
    [parseFileName]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
    },
    multiple: true
  });

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadResults([]);

    const validFiles = files.filter((f) => f.isValid);
    const results: UploadResult[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const fi = validFiles[i];
      try {
        let uploadEndpoint = "";
        let lookupEndpoint = "";
        let lookupKey = "";

        if (fi.reportCategory === "humanitarian") {
          uploadEndpoint = "/api/reports/upload-humanitarian";
          lookupEndpoint = `/api/organizations/by-kratki-broj/${fi.kratkiBroj}`;
          lookupKey = fi.kratkiBroj || "";
        } else if (fi.reportCategory === "provider") {
          uploadEndpoint = "/api/reports/upload-provider";
          lookupEndpoint = `/api/providers/by-name/${encodeURIComponent(fi.providerName || "")}`;
          lookupKey = fi.providerName || "";
        } else if (fi.reportCategory === "parking") {
          uploadEndpoint = "/api/reports/upload-parking";
          lookupEndpoint = `/api/providers/by-name/${encodeURIComponent(fi.parkingProvider || "")}`;
          lookupKey = fi.parkingProvider || "";
        }

        // lookup entity (organization/provider)
        const lookupResponse = await fetch(lookupEndpoint);
        if (!lookupResponse.ok) {
          results.push({
            fileName: fi.fileName,
            success: false,
            category: fi.reportCategory,
            error: `${fi.reportCategory === "humanitarian" ? "Organizacija" : "Provajder"} sa identifikatorom ${lookupKey} nije pronađen`
          });
          setUploadProgress(((i + 1) / validFiles.length) * 100);
          continue;
        }

        const entity = await lookupResponse.json();

        const formData = new FormData();
        formData.append("file", fi.file);

        if (fi.reportCategory === "humanitarian") formData.append("organizationId", entity.id);
        else formData.append("providerId", entity.id);

        formData.append("folderPath", fi.folderPath);
        formData.append("startDate", fi.startDate);
        formData.append("endDate", fi.endDate);

        if (fi.reportCategory === "parking") formData.append("cityName", fi.cityName || "");
        if (fi.reportCategory === "provider") formData.append("serviceType", fi.serviceType || "");

        const uploadResponse = await fetch(uploadEndpoint, { method: "POST", body: formData });

        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          results.push({
            fileName: fi.fileName,
            success: true,
            category: fi.reportCategory,
            organizationId: entity.id,
            organizationName: entity.name,
            filePath: data?.filePath
          });
        } else {
          const txt = await uploadResponse.text();
          results.push({
            fileName: fi.fileName,
            success: false,
            category: fi.reportCategory,
            error: txt || "Greška pri upload-u"
          });
        }
      } catch (err) {
        results.push({
          fileName: fi.fileName,
          success: false,
          category: fi.reportCategory,
          error: "Mrežna greška"
        });
      }

      setUploadProgress(((i + 1) / validFiles.length) * 100);
    }

    setUploadResults(results);
    setUploading(false);
    setFiles((prev) => prev.filter((f) => !results.some((r) => r.fileName === f.fileName && r.success)));
  };

  const validFiles = files.filter((f) => f.isValid);
  const invalidFiles = files.filter((f) => !f.isValid);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "humanitarian":
        return <Users className="h-4 w-4" />;
      case "provider":
        return <Building className="h-4 w-4" />;
      case "parking":
        return <Car className="h-4 w-4" />;
      default:
        return <FileSpreadsheet className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "humanitarian":
        return "text-blue-600";
      case "provider":
        return "text-green-600";
      case "parking":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Multi-Category Report Uploader
          </CardTitle>
          <CardDescription>
            Upload XLS/XLSX fajlove za humanitarne organizacije, provajdere i parking servise. Sistem
            automatski prepoznaje tip i prosleđuje fajl odgovarajućem endpoint-u.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Podržano: Humanitarian (kratki broj u imenu), Provider (postpaid/SDP/Servis, __ProviderName) i Parking.
            </AlertDescription>
          </Alert>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {isDragActive ? <p>Otpustite fajlove ovde...</p> : <p>Povucite i otpustite XLS/XLSX fajlove ovde ili kliknite da izaberete</p>}
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-3">
              {validFiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-green-600">Validni fajlovi ({validFiles.length})</h4>
                  <div className="space-y-2">
                    {validFiles.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(f.reportCategory)}
                          <div>
                            <div className="text-sm font-medium truncate">{f.fileName}</div>
                            <div className="text-xs text-muted-foreground">
                              {f.reportCategory.toUpperCase()} • Period: {f.startDate} - {f.endDate}{" "}
                              {f.isMonthlyReport && <span className="ml-1 text-purple-600">(Mesečni)</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => removeFile(files.indexOf(f))}>
                            Ukloni
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {invalidFiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-red-600">Neispravni fajlovi ({invalidFiles.length})</h4>
                  <div className="space-y-2">
                    {invalidFiles.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileSpreadsheet className="h-4 w-4 text-red-600" />
                          <div>
                            <div className="text-sm font-medium truncate">{f.fileName}</div>
                            {f.error && <div className="text-xs text-red-600">{f.error}</div>}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeFile(files.indexOf(f))}>
                          Ukloni
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Button onClick={uploadFiles} disabled={uploading || validFiles.length === 0}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  {uploading ? `Uploading... (${Math.round(uploadProgress)}%)` : "Upload valid files"}
                </Button>
              </div>

              {uploading && <Progress value={uploadProgress} className="mt-4" />}
            </div>
          )}
        </CardContent>
      </Card>

      {uploadResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rezultati upload-a</CardTitle>
            <CardDescription>Prikaz uspešnih i neuspešnih upload-a</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {uploadResults.map((r, i) => (
              <Alert key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {r.success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                  <div>
                    <div className="text-sm font-medium">{r.fileName} {r.organizationName ? `— ${r.organizationName}` : ""}</div>
                    {r.filePath && (
                      <div className="text-xs text-muted-foreground">
                        <a href={r.filePath} target="_blank" rel="noreferrer" className="underline">
                          {r.filePath}
                        </a>
                      </div>
                    )}
                    {!r.success && r.error && <div className="text-xs text-red-600">{r.error}</div>}
                  </div>
                </div>
                {!r.success && <div className="text-sm text-red-600">Neuspeh</div>}
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default HumanitarianFileUploader;
