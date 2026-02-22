// app/api/parking-services/typescript-import/route.ts
import { NextResponse } from 'next/server';
import { ParkingServiceProcessor } from '@/scripts/vas-import/ParkingServiceProcessor';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { promises as fs } from 'fs';

// ✅ Uklonjeno: dynamic — nije kompatibilno sa cacheComponents
export const maxDuration = 300;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let processor: ParkingServiceProcessor | null = null;

  try {
    const body = await req.json();
    const { filePath } = body as { filePath?: string; parkingServiceId?: string };

    if (!filePath) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 });
    }

    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    processor = new ParkingServiceProcessor(user.id);
    const result = await processor.processFileWithImport(filePath);
    await processor.disconnect();

    return NextResponse.json({
      success: true,
      recordsProcessed: result.recordsProcessed,
      imported: result.imported,
      updated: result.updated,
      errors: result.errors,
      warnings: result.warnings,
      message: `Successfully processed ${result.recordsProcessed} records. Imported: ${result.imported}, Updated: ${result.updated}`,
    });
  } catch (error: unknown) {
    console.error("Import error:", error);

    if (processor) {
      try {
        await processor.disconnect();
      } catch (disconnectError) {
        console.error("Error disconnecting processor:", disconnectError);
      }
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "Processing failed",
        details: message,
        stack: process.env.NODE_ENV === "development" ? stack : undefined,
      },
      { status: 500 }
    );
  }
}