// app/api/parking-services/typescript-import-stream/route.ts
import { NextResponse } from 'next/server';
import { ParkingServiceProcessor } from '@/scripts/vas-import/ParkingServiceProcessor';
import { db } from '@/lib/db';
import { promises as fs } from 'fs';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('filePath');
  const userEmail = searchParams.get('userEmail');

  // Validate inputs
  if (!filePath || !userEmail) {
    return NextResponse.json(
      { error: 'Missing filePath or userEmail' },
      { status: 400 }
    );
  }

  // Provera fajla
  try {
    await fs.access(filePath);
  } catch {
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
  
  // Create a transform stream for SSE
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Helper function to send SSE message
  const sendMessage = (data: any) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  // Immediate connection establishment
  sendMessage({ type: 'status', status: 'connected' });

  // Process in the background
  (async () => {
    let processor: ParkingServiceProcessor | null = null;
    
    try {
      // Find user
      const user = await db.user.findUnique({
        where: { email: userEmail },
        select: { id: true }
      });

      if (!user) {
        sendMessage({ type: 'error', error: 'User not found' });
        writer.close();
        return;
      }

      sendMessage({ type: 'log', message: 'Initializing processor...', logType: 'info' });

      // Create processor with progress callback
      processor = new ParkingServiceProcessor(user.id, {
        onProgress: (fileName: string, progress: number) => {
          sendMessage({ 
            type: 'progress', 
            fileName, 
            progress,
            message: `Processing ${fileName}: ${progress}%`
          });
        },
        onLog: (message: string, logType: 'info' | 'error' | 'success', file?: string) => {
          sendMessage({ 
            type: 'log', 
            message, 
            logType, 
            file 
          });
        },
        onFileStatus: (fileName: string, status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error') => {
          sendMessage({ 
            type: 'fileStatus', 
            fileName, 
            status 
          });
        }
      });

      // FIX: Uklonjen poziv ensureDirectories() - više ne postoji
      // Direktorijumi se automatski kreiraju unutar processFileWithImport
      sendMessage({ type: 'log', message: 'Starting file processing...', logType: 'info' });
      
      // Main processing function - automatski kreira direktorijume
      const result = await processor.processFileWithImport(filePath);
      
      if (!result) {
        sendMessage({
          type: 'error',
          error: 'Processing did not return results'
        });
        writer.close();
        return;
      }
      
      // Send final results
      sendMessage({
        type: 'complete',
        recordsProcessed: result.recordsProcessed,
        imported: result.imported,
        updated: result.updated,
        errors: result.errors,
        warnings: result.warnings,
        message: `Processing completed successfully!`
      });

    } catch (error: any) {
      console.error('Stream processing error:', error);
      sendMessage({
        type: 'error',
        error: 'Processing failed',
        details: error.message
      });
    } finally {
      // Cleanup
      if (processor) {
        try {
          await processor.disconnect();
          sendMessage({ type: 'log', message: 'Database connection closed', logType: 'info' });
        } catch (disconnectError) {
          console.error('Error disconnecting processor:', disconnectError);
        }
      }
      writer.close();
    }
  })();

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}