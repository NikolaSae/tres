// app/api/emails/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * POST /api/emails/upload
 * Upload .eml i .msg fajlova direktno kroz web interface
 */
export async function POST(request: NextRequest) {
  try {
    // Autentifikacija
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validacija file type
    const allowedExtensions = ['.eml', '.msg'];
    const fileExt = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { error: 'Only .eml and .msg files are allowed' },
        { status: 400 }
      );
    }

    // Validacija file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Kreiraj email directory ako ne postoji
    const emailDirectory = join(process.cwd(), 'data', 'emails');
    if (!existsSync(emailDirectory)) {
      await mkdir(emailDirectory, { recursive: true });
    }

    // Kreiraj unique filename (timestamp + original name)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = join(emailDirectory, `${timestamp}__${safeName}`);

    // Čuvanje fajla
    const arrayBuffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(arrayBuffer));

    return NextResponse.json({
      message: 'File uploaded successfully',
      filePath,
      originalName: file.name,
      uploadedBy: session.user.email
    });
  } catch (error) {
    console.error('Email upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}