// app/api/parking-services/typescript-import/route.ts
import { NextResponse } from 'next/server';
import { ParkingServiceProcessor } from '@/scripts/vas-import/ParkingServiceProcessor';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import path from 'path';
import { promises as fs } from 'fs';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await auth();
  
  // FIX: Dodaj proveru za session.user.id takođe
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  let processor: ParkingServiceProcessor | null = null;

  try {
    const body = await req.json();
    const { filePath, parkingServiceId } = body;

    // Validacija file path
    if (!filePath) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    // Provera postojanja fajla
    let fileExists = false;
    try {
      await fs.access(filePath);
      fileExists = true;
    } catch {
      fileExists = false;
    }

    if (!fileExists) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Pronalaženje korisnika
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Kreiranje processor instance
    processor = new ParkingServiceProcessor(user.id);

    // FIX: Uklonjen poziv ensureDirectories() - više ne postoji u klasi
    // Direktorijumi se automatski kreiraju unutar processFileWithImport

    // GLAVNA FUNKCIJA - processFileWithImport umesto processExcelFile
    const result = await processor.processFileWithImport(filePath);

    // Disconnect na kraju
    await processor.disconnect();

    return NextResponse.json({
      success: true,
      recordsProcessed: result.recordsProcessed,
      imported: result.imported,
      updated: result.updated,
      errors: result.errors,
      warnings: result.warnings,
      message: `Successfully processed ${result.recordsProcessed} records. Imported: ${result.imported}, Updated: ${result.updated}`
    });

  } catch (error: any) {
    console.error("Import error:", error);

    // Cleanup u slučaju greške
    if (processor) {
      try {
        await processor.disconnect();
      } catch (disconnectError) {
        console.error("Error disconnecting processor:", disconnectError);
      }
    }

    return NextResponse.json(
      { 
        error: "Processing failed",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}