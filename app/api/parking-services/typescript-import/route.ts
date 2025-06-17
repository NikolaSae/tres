// app/api/parking-services/typescript-import/route.ts
import { NextResponse } from 'next/server';
import { ParkingServiceProcessor } from '@/scripts/vas-import/ParkingServiceProcessor';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import path from 'path';
import { promises as fs } from 'fs'; // Koristite promises API

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { filePath, parkingServiceId } = body;

    // Provera postojanja fajla sa promises API
    let fileExists;
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

    const processor = new ParkingServiceProcessor(user.id);
    const result = await processor.processExcelFile(filePath);

    if (parkingServiceId) {
      const stats = await fs.stat(filePath);
      await processor.updateParkingServiceFileInfo(
        parkingServiceId,
        path.basename(filePath),
        filePath,
        stats.size,
        'completed'
      );
    }

    return NextResponse.json({
      success: true,
      recordsProcessed: result.records.length,
      parkingServiceId: result.parkingServiceId,
      output: result.records
    });

  } catch (error: any) {
    console.error("Import error:", error);
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