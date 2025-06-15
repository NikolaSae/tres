// Path: components/services/ParkingServiceProcessorForm.tsx
"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface FileUploadInfo {
  originalName: string;
  savedName: string;
  filePath: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  parkingServiceId?: string | null;
}

interface FileProcessingStatus {
  file: File;
  status: 'waiting' | 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
  reportPath?: string;
  logs: string[]; // Store logs for each file
}

export function ParkingServiceProcessorForm() {
  const { data: session } = useSession();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingStatus, setProcessingStatus] = useState<FileProcessingStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    
    // Initialize processing status with logs
    setProcessingStatus(files.map(file => ({
      file,
      status: 'waiting',
      message: 'Čeka se obrada',
      logs: ["🚀 Čeka se obrada..."]
    })));
  };

  const updateFileStatus = (fileName: string, status: FileProcessingStatus['status'], message?: string, log?: string, reportPath?: string) => {
    setProcessingStatus(prev => prev.map(item => {
      if (item.file.name === fileName) {
        const newLogs = log ? [...item.logs, log] : item.logs;
        return { 
          ...item, 
          status, 
          message: message || item.message,
          reportPath: reportPath || item.reportPath,
          logs: newLogs
        };
      }
      return item;
    }));
  };

  const processFile = async (file: File) => {
    if (!session?.user?.email) {
      updateFileStatus(file.name, 'error', '🔒 Morate biti prijavljeni', '🔒 Greška: Korisnik nije prijavljen');
      return;
    }

    try {
      updateFileStatus(file.name, 'uploading', '📤 Uploadujem fajl...', '📤 Početak uploada...');
      
      // Upload file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userEmail", session.user.email);

      const uploadRes = await fetch("/api/parking-services/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(`Greška prilikom uploada fajla: ${uploadRes.status} - ${errorText}`);
      }

      const uploadResult = await uploadRes.json();
      updateFileStatus(file.name, 'processing', '🔄 Pokrećem import...', `✅ Fajl uspešno uploadovan: ${uploadResult.fileInfo.savedName}`);
      updateFileStatus(file.name, 'processing', '🔄 Pokrećem import...', `📊 Veličina fajla: ${(uploadResult.fileInfo.size / 1024).toFixed(2)} KB`);

      // Process file
      updateFileStatus(file.name, 'processing', '🔄 Pokrećem import...', '🔄 Pokrećem import skriptu...');
      const importRes = await fetch("/api/parking-services/parking-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: session.user.email,
          uploadedFilePath: uploadResult.fileInfo.filePath,
          parkingServiceId: uploadResult.fileInfo.parkingServiceId,
        }),
      });

      const result = await importRes.json();

      if (importRes.ok && result.success) {
        // Add each log line from the result
        const outputLines = result.output?.split("\n").filter(Boolean) || [];
        outputLines.forEach(line => {
          updateFileStatus(file.name, 'processing', '🔄 Obrada...', line);
        });

        updateFileStatus(file.name, 'completed', '✅ Uspešno importovano', '✅ Import uspešno završen!', result.fileInfo?.lastReportPath);
      } else {
        const errorLog = result.error || "Nepoznata greška";
        const outputLines = result.output?.split("\n").filter(Boolean) || [];
        outputLines.forEach(line => {
          updateFileStatus(file.name, 'processing', '🔄 Obrada...', line);
        });
        updateFileStatus(file.name, 'error', `❌ Greška: ${errorLog}`, `❌ Greška tokom importa: ${errorLog}`);
      }
    } catch (error: any) {
      updateFileStatus(file.name, 'error', `❌ Greška: ${error.message || error}`, `❌ Došlo je do greške: ${error.message || error}`);
    }
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      toast.error("📂 Molimo izaberite fajlove za upload.");
      return;
    }

    if (!session?.user?.email) {
      toast.error("🔒 Morate biti prijavljeni da biste izvršili ovu akciju.");
      return;
    }

    setIsProcessing(true);
    
    // Process files sequentially
    for (const file of selectedFiles) {
      await processFile(file);
    }
    
    setIsProcessing(false);
    
    // Show success message if all completed
    const allSuccess = processingStatus.every(s => s.status === 'completed');
    if (allSuccess) {
      toast.success("✅ Svi fajlovi uspešno importovani!");
    }
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    setProcessingStatus([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
  };

  // Status colors
  const statusColors = {
    waiting: "bg-gray-100 text-gray-700",
    uploading: "bg-blue-100 text-blue-800",
    processing: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Import Parking Service Data</h3>
        {selectedFiles.length > 0 && (
          <button
            onClick={clearFiles}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Obriši sve fajlove
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Upload više Excel fajlova (.xls, .xlsx) odjednom. Fajlovi će biti procesirani sekvencijalno.
      </p>

      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xls,.xlsx"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500"
        />

        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Izabrani fajlovi:</h4>
            {processingStatus.map((status, index) => (
              <div 
                key={index} 
                className={`p-3 border rounded ${statusColors[status.status]}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{status.file.name}</div>
                    <div className="text-sm">
                      <span>Veličina: {formatFileSize(status.file.size)}</span>
                      <span className="mx-2">•</span>
                      <span>Status: {status.message}</span>
                    </div>
                    {status.reportPath && (
                      <div className="mt-1 text-sm">
                        <a 
                          href={status.reportPath} 
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          Pogledaj izveštaj
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {status.status === 'completed' && (
                    <span className="text-green-600">✓</span>
                  )}
                  {status.status === 'error' && (
                    <span className="text-red-600">✗</span>
                  )}
                </div>
                
                {/* Logs section */}
                <div 
                  className={`mt-2 overflow-hidden transition-all duration-300 ${
                    expandedFile === status.file.name ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="mt-2 p-2 bg-gray-50 border rounded max-h-80 overflow-auto">
                    <div className="text-sm font-medium mb-1">Detalji obrade:</div>
                    <div className="space-y-1">
                      {status.logs.map((log, logIndex) => (
                        <div 
                          key={logIndex} 
                          className={`font-mono text-xs p-1 rounded ${
                            log.includes("✅") ? "bg-green-100 text-green-800" :
                            log.includes("❌") ? "bg-red-100 text-red-800" :
                            log.includes("🔄") ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setExpandedFile(
                    expandedFile === status.file.name ? null : status.file.name
                  )}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  {expandedFile === status.file.name ? "Sakrij detalje" : "Prikaži detalje obrade"}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing || selectedFiles.length === 0}
            className={`px-6 py-3 rounded flex items-center gap-2 font-medium ${
              isProcessing || selectedFiles.length === 0
                ? "bg-gray-400 cursor-not-allowed text-gray-200"
                : "bg-blue-600 text-white hover:bg-blue-700 transition"
            }`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                </svg>
                Obrađujem...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Počni Import
              </>
            )}
          </button>
          
          {isProcessing && (
            <button
              type="button"
              onClick={() => setIsProcessing(false)}
              className="px-4 py-3 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Prekini
            </button>
          )}
        </div>
      </div>
    </div>
  );
}