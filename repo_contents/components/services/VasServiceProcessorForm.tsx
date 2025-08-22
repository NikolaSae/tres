"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

interface FileUploadInfo {
  originalName: string;
  savedName: string;
  filePath: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  providerId?: string | null;
}

interface FileProcessingStatus {
  file: File;
  status: 'waiting' | 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
  progress?: number;
  logs: string[];
}

export function VasServiceProcessorForm() {
  const { data: session, status } = useSession();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingStatus, setProcessingStatus] = useState<FileProcessingStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{type: 'success' | 'error', message: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const activeFileNameRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Show loading skeleton while session is loading
  if (status === "loading") {
    return (
      <div className="border rounded-lg p-6 bg-white shadow-sm space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
        <div className="h-12 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotifications(prev => [...prev, { type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    
    setProcessingStatus(files.map(file => ({
      file,
      status: 'waiting',
      progress: 0,
      message: 'Čeka se obrada',
      logs: ["🚀 Čeka se obrada..."]
    })));
  };

  const updateFileStatus = (
    fileName: string, 
    status: FileProcessingStatus['status'], 
    message?: string, 
    log?: string, 
    progress?: number
  ) => {
    setProcessingStatus(prev => prev.map(item => {
      if (item.file.name === fileName) {
        const newLogs = log ? [...item.logs, log] : item.logs;
        return { 
          ...item, 
          status, 
          progress: progress !== undefined ? progress : item.progress,
          message: message || item.message,
          logs: newLogs
        };
      }
      return item;
    }));
  };

  const startVasProcessing = async (file: File, filePath: string) => {
    if (!session?.user?.email) {
      updateFileStatus(file.name, 'error', '🔒 Morate biti prijavljeni', '🔒 Greška: Korisnik nije prijavljen');
      return;
    }

    activeFileNameRef.current = file.name;
    
    try {
      // Create SSE URL
      const sseUrl = `/api/vas-services/postpaid-import-stream?filePath=${encodeURIComponent(filePath)}&userEmail=${encodeURIComponent(session.user.email)}`;
      
      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      // Create new EventSource connection
      eventSourceRef.current = new EventSource(sseUrl);
      
      updateFileStatus(
        file.name, 
        'processing', 
        '🔄 Početak obrade...',
        '🔌 Povezivanje na server za VAS obradu...'
      );
      
      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'status':
              updateFileStatus(
                file.name, 
                'processing', 
                '🔄 Povezan na server...', 
                '🔄 Status: ' + data.status
              );
              break;
              
            case 'log':
              updateFileStatus(
                file.name, 
                'processing', 
                data.message, 
                `${data.logType === 'error' ? '❌' : data.logType === 'success' ? '✅' : 'ℹ️'} ${data.message}`
              );
              break;
              
            case 'progress':
              updateFileStatus(
                file.name, 
                'processing', 
                data.message, 
                `📊 Napredak: ${data.progress}% - ${data.fileName}`,
                data.progress
              );
              break;
              
            case 'fileStatus':
              updateFileStatus(
                file.name, 
                data.status, 
                data.message || `Status: ${data.status}`,
                `📌 Promena statusa: ${data.status}`
              );
              break;
              
            case 'complete':
              updateFileStatus(
                file.name, 
                'completed', 
                '✅ Uspešno završeno',
                `✅ Završeno! Obradjeno zapisa: ${data.recordsProcessed}`
              );
              if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
              }
              break;
              
            case 'error':
              updateFileStatus(
                file.name, 
                'error', 
                '❌ Greška u obradi',
                `❌ ${data.error}${data.details ? ` (${data.details})` : ''}`
              );
              if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
              }
              break;
          }
        } catch (error) {
          updateFileStatus(
            file.name, 
            'error', 
            '❌ Greška u parsiranju podataka',
            `❌ Greška u toku obrade SSE podataka: ${error}`
          );
        }
      };
      
      eventSourceRef.current.onerror = (error) => {
        updateFileStatus(
          file.name, 
          'error', 
          '❌ Greška u vezi',
          `❌ Greška u SSE vezi: ${error}`
        );
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      };
      
    } catch (error: any) {
      updateFileStatus(
        file.name, 
        'error', 
        '❌ Greška u pokretanju obrade',
        `❌ Došlo je do greške: ${error.message || error}`
      );
    }
  };

  const processFile = async (file: File) => {
    if (!session?.user?.email) {
      updateFileStatus(file.name, 'error', '🔒 Morate biti prijavljeni', '🔒 Greška: Korisnik nije prijavljen');
      return;
    }

    try {
      updateFileStatus(file.name, 'uploading', '📤 Uploadujem fajl...', '📤 Početak uploada...');
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userEmail", session.user.email);

      const uploadRes = await fetch("/api/vas-services/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(`Greška prilikom uploada fajla: ${uploadRes.status} - ${errorText}`);
      }

      const uploadResult = await uploadRes.json();
      updateFileStatus(
        file.name, 
        'processing', 
        '🔄 Pokrećem VAS obradu...', 
        `✅ Fajl uspešno uploadovan: ${uploadResult.fileInfo.savedName}`
      );
      updateFileStatus(
        file.name, 
        'processing', 
        '🔄 Pokrećem VAS obradu...', 
        `📊 Veličina fajla: ${(uploadResult.fileInfo.size / 1024).toFixed(2)} KB`
      );

      // Start SSE processing
      await startVasProcessing(file, uploadResult.fileInfo.filePath);

    } catch (error: any) {
      updateFileStatus(
        file.name, 
        'error', 
        `❌ Greška: ${error.message || error}`, 
        `❌ Došlo je do greške: ${error.message || error}`
      );
    }
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      showNotification("error", "📂 Molimo izaberite fajlove za upload.");
      return;
    }

    if (!session?.user?.email) {
      showNotification("error", "🔒 Morate biti prijavljeni da biste izvršili ovu akciju.");
      return;
    }

    setIsProcessing(true);
    
    // Process files sequentially
    for (const file of selectedFiles) {
      if (processingStatus.find(s => s.file.name === file.name)?.status === 'completed') {
        continue; // Skip already processed files
      }
      
      await processFile(file);
    }
    
    setIsProcessing(false);
    
    const allSuccess = processingStatus.every(s => s.status === 'completed');
    if (allSuccess) {
      showNotification("success", "✅ Svi VAS fajlovi uspešno importovani!");
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

  const statusColors = {
    waiting: "bg-gray-100 text-gray-700",
    uploading: "bg-blue-100 text-blue-800",
    processing: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
  };

  // Show authentication required message if not logged in
  if (!session) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Potrebna je prijava</h3>
          <p className="text-gray-500">Molimo prijavite se da biste mogli da importujete VAS servise.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm space-y-6">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className={`px-4 py-3 rounded-md shadow-lg ${
                notification.type === 'success' 
                  ? 'bg-green-100 text-green-800 border border-green-300' 
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              {notification.message}
            </div>
          ))}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Import VAS Service Data</h3>
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
        Upload Excel fajlova (.xls, .xlsx) sa VAS servisima. Fajlovi će biti procesirani sekvencijalno.
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
                    {status.progress !== undefined && status.progress > 0 && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${status.progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                  
                  {status.status === 'completed' && (
                    <span className="text-green-600 text-xl">✓</span>
                  )}
                  {status.status === 'error' && (
                    <span className="text-red-600 text-xl">✗</span>
                  )}
                </div>
                
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
                            log.includes("📤") ? "bg-blue-100 text-blue-800" :
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
                  {expandedFile === status.file.name ? "📤 Sakrij detalje" : "📋 Prikaži detalje obrade"}
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
            className={`px-6 py-3 rounded flex items-center gap-2 font-medium transition-all ${
              isProcessing || selectedFiles.length === 0
                ? "bg-gray-400 cursor-not-allowed text-gray-200"
                : "bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg"
            }`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                </svg>
                Obrađujem VAS servise...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Importuj VAS Servise
              </>
            )}
          </button>
          
          {isProcessing && (
            <button
              type="button"
              onClick={() => {
                setIsProcessing(false);
                if (eventSourceRef.current) {
                  eventSourceRef.current.close();
                  eventSourceRef.current = null;
                }
                if (activeFileNameRef.current) {
                  updateFileStatus(
                    activeFileNameRef.current, 
                    'error', 
                    '❌ Prekinuto od strane korisnika',
                    '❌ Obrada prekinuta od strane korisnika'
                  );
                }
              }}
              className="px-4 py-3 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              ⏹️ Prekini
            </button>
          )}
        </div>

        <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded">
          💡 <strong>Napomena:</strong> VAS servisi će biti automatski kreirani ako ne postoje u bazi podataka. 
          Podržani su Excel formati (.xls, .xlsx) sa podacima o VAS servisima. Obrađuje se jedan fajl po jedan.
        </div>
      </div>
    </div>
  );
}