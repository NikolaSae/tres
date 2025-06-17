// Path: components/services/ParkingServiceProcessorForm.tsx

"use client";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

export function NewParkingProcessorForm() {
  const { data: session } = useSession();
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState<{file: string; message: string; type: 'info' | 'error' | 'success'}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    addLog(`Selected ${selected.length} files`, 'info');
  };

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info', file?: string) => {
    setLogs(prev => [...prev, {
      file: file || 'system',
      message,
      type
    }]);
  };

  const processFiles = async () => {
    if (!session?.user?.email || files.length === 0) return;

    setProcessing(true);
    
    try {
      for (const file of files) {
        await processSingleFile(file);
      }
      
      toast.success('Processing completed successfully');
    } catch (error) {
      toast.error('Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const processSingleFile = async (file: File) => {
    addLog(`Starting upload for ${file.name}`, 'info', file.name);
    
    try {
      // 1. Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userEmail', session.user.email);

      const uploadRes = await fetch('/api/parking-services/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) throw new Error('Upload failed');
      
      const uploadData = await uploadRes.json();
      addLog(`File uploaded to ${uploadData.fileInfo.filePath}`, 'success', file.name);

      // 2. Process with TypeScript
      addLog('Starting TypeScript processor', 'info', file.name);
      const processRes = await fetch('/api/parking-services/typescript-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: uploadData.fileInfo.filePath,
          userEmail: session.user.email
        })
      });

      const processData = await processRes.json();
      
      if (processRes.ok) {
        addLog(`Processed ${processData.recordsProcessed} records`, 'success', file.name);
        addLog(`Parking service ID: ${processData.parkingServiceId}`, 'info', file.name);
      } else {
        throw new Error(processData.error || 'Processing failed');
      }
    } catch (error: any) {
      addLog(`Error: ${error.message}`, 'error', file.name);
      throw error;
    }
  };

  const clearAll = () => {
    setFiles([]);
    setLogs([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

      <div className="flex gap-3 mb-6">
        <button
          onClick={processFiles}
          disabled={processing || files.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {processing ? 'Processing...' : 'Start Processing'}
        </button>
        
        <button
          onClick={clearAll}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Clear All
        </button>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-medium mb-2">Processing Logs</h3>
        <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div 
                  key={index}
                  className={`p-2 text-sm rounded ${
                    log.type === 'error' ? 'bg-red-100 text-red-800' :
                    log.type === 'success' ? 'bg-green-100 text-green-800' :
                    'bg-blue-50 text-blue-800'
                  }`}
                >
                  {log.file !== 'system' && (
                    <span className="font-medium">{log.file}: </span>
                  )}
                  {log.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}