// app/api/vas-services/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

// Simple MIME type mapping for Excel files
const EXCEL_MIME_TYPES: Record<string, string> = {
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Morate biti prijavljeni da biste uploadovali fajlove' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userEmail = formData.get('userEmail') as string | null;

    // Validate inputs
    if (!file || !userEmail) {
      return NextResponse.json(
        { error: 'Nedostaje fajl ili email korisnika' },
        { status: 400 }
      );
    }

    // Find user in database
    const user = await db.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Korisnik nije pronađen' },
        { status: 404 }
      );
    }

    // Create upload directories
    const PROJECT_ROOT = process.cwd();
    const UPLOAD_DIR = path.join(PROJECT_ROOT, 'scripts', 'input-vas-services');
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const fileExtension = path.extname(file.name).toLowerCase();
    const originalName = file.name;
    const savedName = `${randomUUID()}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, savedName);

    // Convert file to buffer and save
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Get file metadata
    const fileStats = await fs.stat(filePath);
    
    // Determine MIME type based on extension
    const mimeType = EXCEL_MIME_TYPES[fileExtension] || 'application/octet-stream';

    // Extract provider from filename
    const provider = extractProviderFromFilename(originalName);

    // Create file record in database
    const fileRecord = await db.vasServiceFile.create({
      data: {
        originalName,
        savedName,
        filePath,
        size: fileStats.size,
        type: mimeType,
        uploadedBy: user.id,
        status: 'UPLOADED',
        provider,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Fajl uspešno uploadovan',
      fileInfo: {
        id: fileRecord.id,
        originalName,
        savedName,
        filePath,
        size: fileStats.size,
        type: mimeType,
        uploadedBy: user.id,
        uploadedAt: fileRecord.uploadedAt.toISOString(),
        provider: fileRecord.provider,
      }
    });

  } catch (error: any) {
    console.error('VAS file upload error:', error);
    return NextResponse.json(
      { 
        error: 'Došlo je do greške prilikom uploada fajla',
        details: error.message || 'Nepoznata greška'
      },
      { status: 500 }
    );
  }
}

// Helper to extract provider from filename
function extractProviderFromFilename(filename: string): string {
  const patterns = [
    /SDP_mParking_([A-Za-zđĐčČćĆžŽšŠ]+)_/i,
    /mParking_([A-Za-z0-9]+)_/i,
    /Postpaid_([A-Za-z0-9]+)_/i,
    /^([A-Za-z0-9]+)_postpaid_/i
  ];

  const basename = path.basename(filename, path.extname(filename));
  
  for (const pattern of patterns) {
    const match = basename.match(pattern);
    if (match && match[1]) {
      return match[1]
        .replace(/_+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\d{5,}$/g, '')
        .trim();
    }
  }

  // Fallback: use first part of filename
  return basename.split(/[_\-\s]+/)[0] || 'UnknownProvider';
}