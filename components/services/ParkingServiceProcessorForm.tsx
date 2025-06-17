// Path: components/services/ParkingServiceProcessorForm.tsx
// PROBLEM: Form ne prima poruke iz procesora jer nema callback mehanizam

"use client";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface LogEntry {
  file: string;
  message: string;
  type: 'info' | 'error' | 'success';
  timestamp: Date;
}

interface FileProgress {
  name: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  recordsProcessed?: number;
  parkingServiceId?: string;
  error?: string;
}

export function NewParkingProcessorForm() {
  const { data: session } = useSession();
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    
    const initialProgress = selected.map(file => ({
      name: file.name,
      status: 'pending' as const,
      progress: 0
    }));
    setFileProgress(initialProgress);
    
    addLog(`Selektovano ${selected.length} fajlova`, 'info');
  };

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info', file?: string) => {
    setLogs(prev => [...prev, {
      file: file || 'system',
      message,
      type,
      timestamp: new Date()
    }]);
  };

  const updateFileProgress = (fileName: string, updates: Partial<FileProgress>) => {
    setFileProgress(prev => prev.map(fp => 
      fp.name === fileName ? { ...fp, ...updates } : fp
    ));
  };

  const updateOverallProgress = () => {
    setFileProgress(prev => {
      const totalFiles = prev.length;
      const completedFiles = prev.filter(fp => fp.status === 'completed' || fp.status === 'error').length;
      const newProgress = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0;
      setOverallProgress(newProgress);
      return prev;
    });
  };

  const processFiles = async () => {
    if (!session?.user?.email || files.length === 0) return;

    setProcessing(true);
    setOverallProgress(0);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        updateFileProgress(file.name, { status: 'uploading', progress: 10 });
        
        try {
          await processSingleFile(file);
          updateFileProgress(file.name, { status: 'completed', progress: 100 });
        } catch (error) {
          updateFileProgress(file.name, { 
            status: 'error', 
            progress: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        
        updateOverallProgress();
      }
      
      toast.success('Obrađivanje završeno uspešno');
    } catch (error) {
      toast.error('Obrađivanje neuspešno');
    } finally {
      setProcessing(false);
    }
  };

  const processSingleFile = async (file: File) => {
  addLog(`Započinje upload za ${file.name}`, 'info', file.name);
  updateFileProgress(file.name, { progress: 20 });
  
  try {
      // 1. Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userEmail', session.user.email);

      const uploadRes = await fetch('/api/parking-services/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) throw new Error('Upload neuspešan');
      
      const uploadData = await uploadRes.json();
      addLog(`Fajl uploadovan na ${uploadData.fileInfo.filePath}`, 'success', file.name);
      updateFileProgress(file.name, { status: 'processing', progress: 50 });

      // 2. Process with streaming logs
      addLog('Započinje TypeScript procesor', 'info', file.name);
      
      // ISPRAVKA: Dodaj Server-Sent Events za realtime logove
      const eventSource = new EventSource(`/api/parking-services/typescript-import-stream?filePath=${encodeURIComponent(uploadData.fileInfo.filePath)}&userEmail=${encodeURIComponent(session.user.email)}`);
      let lastProgress = 50;
    let processingComplete = false;
      const onError = (event: Event) => {
      if (processingComplete) return;
      
      
      // Capture meaningful error info
      const errorInfo = event instanceof ErrorEvent 
        ? event.message 
        : `Type: ${event.type}`;
      
      addLog(`Greška u streaming: ${errorInfo}`, 'error', file.name);
      eventSource.close();
      reject(new Error('Streaming greška'));
    };
    
    eventSource.onerror = onError;
    
    // Message handler
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'log') {
          addLog(data.message, data.logType || 'info', file.name);
        } else if (data.type === 'progress') {
          updateFileProgress(file.name, { progress: Math.max(lastProgress, data.progress) });
          lastProgress = data.progress;
        } else if (data.type === 'status') {
          updateFileProgress(file.name, { status: data.status });
        } else if (data.type === 'complete') {
          addLog(`Obrađeno ${data.recordsProcessed} zapisa`, 'success', file.name);
          addLog(`Parking service ID: ${data.parkingServiceId}`, 'info', file.name);
          updateFileProgress(file.name, { 
            recordsProcessed: data.recordsProcessed,
            parkingServiceId: data.parkingServiceId,
            progress: 100
          });
          processingComplete = true;
          eventSource.close();
          resolve();
        } else if (data.type === 'error') {
          addLog(`Greška obrade: ${data.error}`, 'error', file.name);
          processingComplete = true;
          eventSource.close();
          reject(new Error(data.error || 'Obrađivanje neuspešno'));
        }
      } catch (parseError) {
        addLog(`Greška u parsiranju log poruke: ${parseError}`, 'error', file.name);
      }
    };
    
    // Timeout handler
    const timeoutId = setTimeout(() => {
      if (!processingComplete) {
        addLog('Vreme za obradu isteklo', 'error', file.name);
        eventSource.close();
        reject(new Error('Timeout'));
      }
    }, 300000); // 5 minuta timeout

    // Cleanup when done
    eventSource.addEventListener('complete', () => {
      clearTimeout(timeoutId);
      resolve();
    });
    
    eventSource.addEventListener('error', () => {
      clearTimeout(timeoutId);
      reject();
    });

  } catch (error: any) {
    addLog(`Greška: ${error.message}`, 'error', file.name);
    throw error;
  }
};
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'log') {
            addLog(data.message, data.logType || 'info', file.name);
          } else if (data.type === 'progress') {
            updateFileProgress(file.name, { progress: Math.max(lastProgress, data.progress) });
            lastProgress = data.progress;
          } else if (data.type === 'status') {
            updateFileProgress(file.name, { status: data.status });
          } else if (data.type === 'complete') {
            addLog(`Obrađeno ${data.recordsProcessed} zapisa`, 'success', file.name);
            addLog(`Parking service ID: ${data.parkingServiceId}`, 'info', file.name);
            updateFileProgress(file.name, { 
              recordsProcessed: data.recordsProcessed,
              parkingServiceId: data.parkingServiceId,
              progress: 100
            });
            eventSource.close();
          } else if (data.type === 'error') {
            throw new Error(data.error || 'Obrađivanje neuspešno');
          }
        } catch (parseError) {
          addLog(`Greška u parsiranju log poruke: ${parseError}`, 'error', file.name);
        }
      };
      
      eventSource.onerror = (error) => {
        addLog(`Greška u streaming: ${error}`, 'error', file.name);
        eventSource.close();
        throw new Error('Streaming greška');
      };
      
      // Čekaj da se završi
      await new Promise((resolve, reject) => {
        eventSource.addEventListener('complete', resolve);
        eventSource.addEventListener('error', reject);
        setTimeout(() => {
          eventSource.close();
          reject(new Error('Timeout'));
        }, 300000); // 5 minuta timeout
      });

    } catch (error: any) {
      addLog(`Greška: ${error.message}`, 'error', file.name);
      throw error;
    }
  };

  const clearAll = () => {
    setFiles([]);
    setLogs([]);
    setFileProgress([]);
    setOverallProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStatusColor = (status: FileProgress['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-200';
      case 'uploading': return 'bg-blue-200';
      case 'processing': return 'bg-yellow-200';
      case 'completed': return 'bg-green-200';
      case 'error': return 'bg-red-200';
      default: return 'bg-gray-200';
    }
  };

  const getStatusText = (status: FileProgress['status']) => {
    switch (status) {
      case 'pending': return 'Na čekanju';
      case 'uploading': return 'Upload...';
      case 'processing': return 'Obrađuje se...';
      case 'completed': return 'Završeno';
      case 'error': return 'Greška';
      default: return 'Nepoznato';
    }
  };

  const groupedLogs = logs.reduce((acc, log) => {
    if (!acc[log.file]) {
      acc[log.file] = [];
    }
    acc[log.file].push(log);
    return acc;
  }, {} as Record<string, LogEntry[]>);

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h2 className="text-xl font-bold mb-4">New Parking Service Processor</h2>
      
      <div className="mb-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls"
          multiple
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {processing && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Ukupan progres</span>
            <span className="text-sm text-gray-600">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {fileProgress.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium mb-3">Status fajlova</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {fileProgress.map((fp, index) => (
              <div key={index} className={`p-3 rounded-lg border ${getStatusColor(fp.status)}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium truncate flex-1 mr-2">{fp.name}</span>
                  <span className="text-xs font-semibold">{getStatusText(fp.status)}</span>
                </div>
                
                {fp.status !== 'pending' && (
                  <div className="mb-2">
                    <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${fp.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {fp.recordsProcessed !== undefined && (
                  <div className="text-xs text-gray-600">
                    Obrađeno zapisa: {fp.recordsProcessed}
                  </div>
                )}
                
                {fp.parkingServiceId && (
                  <div className="text-xs text-gray-600 truncate">
                    Service ID: {fp.parkingServiceId}
                  </div>
                )}
                
                {fp.error && (
                  <div className="text-xs text-red-600 mt-1">
                    {fp.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-6">
        <button
          onClick={processFiles}
          disabled={processing || files.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {processing ? 'Obrađuje se...' : 'Započni obrađivanje'}
        </button>
        
        <button
          onClick={clearAll}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Obriši sve
        </button>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-medium mb-2">Logovi obrađivanja</h3>
        <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">Nema logova</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedLogs).map(([fileName, fileLogs]) => (
                <div key={fileName} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-sm mb-2 text-gray-800">
                    {fileName === 'system' ? '🔧 Sistem' : `📄 ${fileName}`}
                  </h4>
                  <div className="space-y-1">
                    {fileLogs.map((log, index) => (
                      <div 
                        key={index}
                        className={`p-2 text-sm rounded ${
                          log.type === 'error' ? 'bg-red-100 text-red-800' :
                          log.type === 'success' ? 'bg-green-100 text-green-800' :
                          'bg-blue-50 text-blue-800'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="flex-1">{log.message}</span>
                          <span className="text-xs opacity-70 ml-2">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}