// app/api/vas-services/postpaid-import-stream/route.ts
import { NextResponse } from 'next/server';
import { PostpaidServiceProcessor } from '@/scripts/vas-import/PostpaidServiceProcessor';
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

  // Check file existence
  try {
    await fs.access(filePath);
  } catch {
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }

  // Create SSE transform stream
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Helper to send SSE messages
  const sendMessage = (data: any) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  // Send initial connection confirmation
  sendMessage({ type: 'status', status: 'connected' });

  // Background processing
  (async () => {
    let processor: PostpaidServiceProcessor | null = null;
    
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

      sendMessage({ type: 'log', message: 'Initializing VAS processor...', logType: 'info' });

      // Create processor with callbacks
      processor = new PostpaidServiceProcessor(user.id, {
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

      sendMessage({ type: 'log', message: 'Preparing directories...', logType: 'info' });
      await processor.ensureDirectories();

      sendMessage({ type: 'log', message: 'Starting VAS file processing...', logType: 'info' });
      
      // Process the file
      const result = await processor.processVasServiceFiles(filePath);
      
      if (!result || result.length === 0 || !result[0].success) {
        sendMessage({
          type: 'error',
          error: 'VAS processing failed',
          details: result?.[0]?.error || 'Unknown error'
        });
      } else {
        const firstResult = result[0];
        sendMessage({
          type: 'complete',
          recordsProcessed: firstResult.processedRecords,
          errors: firstResult.errors,
          duplicates: firstResult.duplicates,
          message: `Processed ${firstResult.processedRecords} VAS records successfully!`
        });
      }

    } catch (error: any) {
      console.error('VAS processing error:', error);
      sendMessage({
        type: 'error',
        error: 'VAS processing failed',
        details: error.message
      });
    } finally {
      // Cleanup resources
      if (processor) {
        try {
          await processor.cleanup();
          sendMessage({ type: 'log', message: 'Processor cleaned up', logType: 'info' });
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
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