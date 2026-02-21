// Path: components/services/ProviderProcessorForm.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface Provider {
  id: string;
  name: string;
}

interface FileUploadInfo {
  originalName: string;
  savedName: string;
  filePath: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface FileProcessingStatus {
  file: File;
  status: 'waiting' | 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
  reportPath?: string;
  logs: string[];
  detectedProviderId?: string | null;
  manualProviderId?: string;
}

export function ProviderProcessorForm() {
  const { data: session } = useSession();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingStatus, setProcessingStatus] = useState<FileProcessingStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Učitaj listu provajdera - kompatibilno sa postojećim API-jem
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        // ✅ Koristi postojeći API sa limitom za sve provajdere
        const response = await fetch('/api/providers?limit=1000&sortBy=name&sortDirection=asc');
        if (response.ok) {
          const data = await response.json();
          // ✅ API vraća { items: [...], total, page, limit }
          setProviders(data.items.map((p: any) => ({ id: p.id, name: p.name })));
        } else {
          toast.error("Greška pri učitavanju provajdera");
        }
      } catch (error) {
        console.error("Error fetching providers:", error);
        toast.error("Greška pri učitavanju provajdera");
      } finally {
        setIsLoadingProviders(false);
      }
    };

    fetchProviders();
  }, []);

  // Ekstraktuj Provider ID iz imena fajla
  const extractProviderFromFilename = (filename: string): { id: string | null, name: string | null } => {
    // Format: Servis__MicropaymentMerchantReport_SDP_Media_IMEPROVAJDERA_XXXX__datum
    // Traži deo između _ nakon "Media_"
    
    const parts = filename.split('_');
    
    // Pronađi "Media" kao anchor point
    const mediaIndex = parts.findIndex(p => p.toLowerCase() === 'media');
    
    if (mediaIndex !== -1 && mediaIndex + 1 < parts.length) {
      const providerNameFromFile = parts[mediaIndex + 1];
      
      // Traži provajdera sa tim imenom (case-insensitive, partial match)
      const foundProvider = providers.find(p => {
        const pName = p.name.toLowerCase();
        const fName = providerNameFromFile.toLowerCase();
        return pName.includes(fName) || fName.includes(pName);
      });
      
      if (foundProvider) {
        return { id: foundProvider.id, name: foundProvider.name };
      }
      
      // Ako ne nađe exact match, vrati samo ime iz fajla
      return { id: null, name: providerNameFromFile };
    }
    
    return { id: null, name: null };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    
    setProcessingStatus(files.map(file => {
      const detected = extractProviderFromFilename(file.name);
      const isValidProvider = detected.id !== null;
      
      return {
        file,
        status: 'waiting',
        message: isValidProvider 
          ? `✅ Provajder detektovan: ${detected.name}`
          : detected.name 
            ? `⚠️ Provajder "${detected.name}" nije pronađen - izaberite ručno`
            : '⚠️ Provajder nije detektovan - izaberite ručno',
        logs: [
          "🚀 Čeka se obrada...",
          isValidProvider 
            ? `✅ Auto-detektovan provajder: ${detected.name}`
            : detected.name
              ? `⚠️ Provajder "${detected.name}" nije pronađen u bazi`
              : `⚠️ Ne mogu izvući ime provajdera iz: ${file.name}`
        ],
        detectedProviderId: detected.id,
        manualProviderId: undefined
      };
    }));
  };

  const updateFileStatus = (
    fileName: string, 
    status: FileProcessingStatus['status'], 
    message?: string, 
    log?: string, 
    reportPath?: string
  ) => {
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

  const handleProviderSelect = (fileName: string, providerId: string) => {
    setProcessingStatus(prev => prev.map(item => {
      if (item.file.name === fileName) {
        const provider = providers.find(p => p.id === providerId);
        return {
          ...item,
          manualProviderId: providerId,
          message: `✅ Ručno izabran provajder: ${provider?.name}`,
          logs: [...item.logs, `👆 Ručno izabran provajder: ${provider?.name}`]
        };
      }
      return item;
    }));
  };

  const processFile = async (file: File, providerId: string) => {
    if (!session?.user?.email) {
      updateFileStatus(file.name, 'error', '🔒 Morate biti prijavljeni', '🔒 Greška: Korisnik nije prijavljen');
      return;
    }

    try {
      updateFileStatus(file.name, 'uploading', '📤 Uploadujem fajl...', '📤 Početak uploada...');
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userEmail", session.user.email);

      const uploadRes = await fetch("/api/providers/upload", {
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

      // Process file with providerId
      const provider = providers.find(p => p.id === providerId);
      updateFileStatus(file.name, 'processing', '🔄 Pokrećem import...', `🔄 Pokrećem import za provajdera: ${provider?.name || providerId}`);
      
      const importRes = await fetch("/api/providers/vas-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: session.user.email,
          uploadedFilePath: uploadResult.fileInfo.filePath,
          providerId: providerId,
        }),
      });

      const result = await importRes.json();

      if (importRes.ok && result.success) {
        updateFileStatus(
          file.name, 
          'completed', 
          `✅ Uspešno importovano: ${result.imported} zapisa`, 
          `✅ Import uspešno završen! Importovano: ${result.imported}, Neuspešno: ${result.failed}`, 
          result.reportPath
        );
        
        if (result.failed > 0 && result.errors) {
          result.errors.forEach((error: string) => {
            updateFileStatus(file.name, 'completed', undefined, `⚠️ ${error}`);
          });
        }
      } else {
        const errorLog = result.error || "Nepoznata greška";
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

    // Proveri da li svi fajlovi imaju providerId
    const filesWithoutProvider = processingStatus.filter(
      status => !status.detectedProviderId && !status.manualProviderId
    );

    if (filesWithoutProvider.length > 0) {
      toast.error(`⚠️ ${filesWithoutProvider.length} fajl(ova) nema izabranog provajdera. Molimo izaberite provajdera za svaki fajl.`);
      return;
    }

    setIsProcessing(true);
    
    for (const status of processingStatus) {
      const providerId = status.manualProviderId || status.detectedProviderId;
      if (providerId) {
        await processFile(status.file, providerId);
      }
    }
    
    setIsProcessing(false);
    
    const completedCount = processingStatus.filter(s => s.status === 'completed').length;
    const errorCount = processingStatus.filter(s => s.status === 'error').length;
    
    if (errorCount === 0) {
      toast.success(`✅ Svi fajlovi uspešno importovani! (${completedCount}/${processingStatus.length})`);
    } else {
      toast.error(`⚠️ ${completedCount}/${processingStatus.length} fajlova uspešno importovano. ${errorCount} sa greškama.`);
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
    waiting: "bg-gray-100 text-gray-700 border-gray-300",
    uploading: "bg-blue-50 text-blue-800 border-blue-300",
    processing: "bg-yellow-50 text-yellow-800 border-yellow-300",
    completed: "bg-green-50 text-green-800 border-green-300",
    error: "bg-red-50 text-red-800 border-red-300",
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Import VAS Provider Data</h3>
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
        Upload Excel fajlova (.xls, .xlsx) sa VAS transakcijama. Sistem će pokušati automatski da detektuje provajdera iz imena fajla.
        <br />
        <span className="text-xs text-gray-400">
          Format imena: <code>Servis__MicropaymentMerchantReport_SDP_Media_<strong>IMEPROVAJDERA</strong>_XXXX__datum.xls</code>
        </span>
      </p>

      {isLoadingProviders && (
        <div className="text-sm text-blue-600 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
          </svg>
          Učitavam listu provajdera...
        </div>
      )}

      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xls,.xlsx"
          multiple
          onChange={handleFileChange}
          disabled={isLoadingProviders}
          className="block w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Izabrani fajlovi ({selectedFiles.length}):</h4>
            {processingStatus.map((status, index) => {
              const finalProviderId = status.manualProviderId || status.detectedProviderId;
              const needsManualSelection = !status.detectedProviderId && !status.manualProviderId;

              return (
                <div 
                  key={index} 
                  className={`p-4 border-2 rounded-lg ${statusColors[status.status]} transition-all`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate" title={status.file.name}>
                        {status.file.name}
                      </div>
                      <div className="text-sm mt-1">
                        <span>Veličina: {formatFileSize(status.file.size)}</span>
                        <span className="mx-2">•</span>
                        <span>{status.message}</span>
                      </div>

                      {/* Dropdown za ručni izbor provajdera */}
                      {needsManualSelection && status.status === 'waiting' && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium mb-1">
                            ⚠️ Izaberite provajdera:
                          </label>
                          <select
                            onChange={(e) => handleProviderSelect(status.file.name, e.target.value)}
                            className="block w-full text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white"
                            defaultValue=""
                          >
                            <option value="" disabled>-- Izaberite provajdera --</option>
                            {providers.map(provider => (
                              <option key={provider.id} value={provider.id}>
                                {provider.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Prikaz izabranog provajdera */}
                      {finalProviderId && (
                        <div className="mt-2 text-sm flex items-center gap-2">
                          <span className="font-medium">Provajder:</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {providers.find(p => p.id === finalProviderId)?.name || finalProviderId}
                          </span>
                        </div>
                      )}

                      {status.reportPath && (
                        <div className="mt-2 text-sm">
                          <a 
                            href={status.reportPath} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                          >
                            📄 Pogledaj izveštaj
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0">
                      {status.status === 'completed' && (
                        <span className="text-green-600 text-2xl">✓</span>
                      )}
                      {status.status === 'error' && (
                        <span className="text-red-600 text-2xl">✗</span>
                      )}
                      {status.status === 'uploading' && (
                        <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                        </svg>
                      )}
                      {status.status === 'processing' && (
                        <svg className="animate-spin h-6 w-6 text-yellow-600" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  {/* Expandable logs section */}
                  <div 
                    className={`overflow-hidden transition-all duration-300 ${
                      expandedFile === status.file.name ? 'max-h-96 mt-3' : 'max-h-0'
                    }`}
                  >
                    <div className="p-3 bg-white border rounded-lg max-h-80 overflow-auto">
                      <div className="text-sm font-medium mb-2">📋 Detalji obrade:</div>
                      <div className="space-y-1">
                        {status.logs.map((log, logIndex) => (
                          <div 
                            key={logIndex} 
                            className={`font-mono text-xs p-2 rounded ${
                              log.includes("✅") ? "bg-green-100 text-green-800" :
                              log.includes("❌") ? "bg-red-100 text-red-800" :
                              log.includes("🔄") ? "bg-yellow-100 text-yellow-800" :
                              log.includes("⚠️") ? "bg-orange-100 text-orange-800" :
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
                    className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {expandedFile === status.file.name ? "▲ Sakrij detalje" : "▼ Prikaži detalje obrade"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing || selectedFiles.length === 0 || isLoadingProviders}
            className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-all ${
              isProcessing || selectedFiles.length === 0 || isLoadingProviders
                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
            }`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                </svg>
                Obrađujem fajlove...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Počni Import ({selectedFiles.length})
              </>
            )}
          </button>
          
          {isProcessing && (
            <button
              type="button"
              onClick={() => {
                setIsProcessing(false);
                toast.error("Import prekinut");
              }}
              className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium shadow-md"
            >
              Prekini
            </button>
          )}
        </div>
      </div>
    </div>
  );
}