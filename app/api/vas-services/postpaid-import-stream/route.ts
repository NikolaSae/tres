// app/api/vas-services/postpaid-import-stream/route.ts
import { NextResponse } from 'next/server';
import { ParkingServiceProcessor } from '@/scripts/vas-import/ParkingServiceProcessor';
import { db } from '@/lib/db';
import { promises as fs } from 'fs';

// ✅ Uklonjeno: dynamic
export const maxDuration = 300;

// Tip za SSE poruke
type SseMessage =
  | { type: 'status'; status: string }
  | { type: 'log'; message: string; logType: 'info' | 'error' | 'success'; file?: string }
  | { type: 'progress'; fileName: string; progress: number; message: string }
  | { type: 'fileStatus'; fileName: string; status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error' }
  | { type: 'complete'; recordsProcessed: number; errors: number; duplicates: number; imported: number; updated: number; warnings: number; message: string }
  | { type: 'error'; error: string; details?: string };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('filePath');
  const userEmail = searchParams.get('userEmail');

  if (!filePath || !userEmail) {
    return NextResponse.json({ error: 'Missing filePath or userEmail' }, { status: 400 });
  }

  try {
    await fs.access(filePath);
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const sendMessage = (data: SseMessage) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  sendMessage({ type: 'status', status: 'connected' });

  (async () => {
    let processor: ParkingServiceProcessor | null = null;

    try {
      const user = await db.user.findUnique({
        where: { email: userEmail },
        select: { id: true },
      });

      if (!user) {
        sendMessage({ type: 'error', error: 'User not found' });
        writer.close();
        return;
      }

      sendMessage({ type: 'log', message: 'Initializing processor...', logType: 'info' });

      processor = new ParkingServiceProcessor(user.id, {
        onProgress: (fileName: string, progress: number) => {
          sendMessage({ type: 'progress', fileName, progress, message: `Processing ${fileName}: ${progress}%` });
        },
        onLog: (message: string, logType: 'info' | 'error' | 'success', file?: string) => {
          sendMessage({ type: 'log', message, logType, file });
        },
        onFileStatus: (fileName: string, status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error') => {
          sendMessage({ type: 'fileStatus', fileName, status });
        },
      });

      sendMessage({ type: 'log', message: 'Starting file processing...', logType: 'info' });

      const result = await processor.processFileWithImport(filePath);

      if (!result) {
        sendMessage({ type: 'error', error: 'Processing did not return results' });
        writer.close();
        return;
      }

      sendMessage({
  type: 'complete',
  recordsProcessed: result.recordsProcessed,
  imported: result.imported,
  updated: result.updated,
  errors: result.errors,
  duplicates: result.duplicates ?? 0,
  warnings: result.warnings.length,
  message: 'Processing completed successfully!',
});
    } catch (error: unknown) {
      console.error('Stream processing error:', error);
      sendMessage({
        type: 'error',
        error: 'Processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
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
      'Connection': 'keep-alive',
    },
  });
}