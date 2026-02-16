// app/api/providers/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { existsSync } from "fs";

// ✅ Allowed file types
const ALLOWED_MIME_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const ALLOWED_EXTENSIONS = /\.(xls|xlsx)$/i;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // ✅ Auth check
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - please log in" },
        { status: 401 }
      );
    }

    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    // ✅ Validate file exists
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // ✅ Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.test(file.name)) {
      return NextResponse.json(
        { error: "Only Excel files (.xls, .xlsx) are allowed" },
        { status: 400 }
      );
    }

    // ✅ Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // ✅ Sanitize filename
    const sanitizedFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_'); // Replace multiple underscores with single

    const timestamp = Date.now();
    const fileName = `${timestamp}_${sanitizedFileName}`;
    
    // ✅ Ensure directory exists
    const inputDir = path.join(process.cwd(), "scripts", "input");
    
    if (!existsSync(inputDir)) {
      await mkdir(inputDir, { recursive: true });
      console.log(`📁 Created directory: ${inputDir}`);
    }

    const filePath = path.join(inputDir, fileName);

    // ✅ Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log(`✅ File uploaded: ${fileName} by ${session.user.email || session.user.name}`);

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      fileInfo: {
        originalName: file.name,
        savedName: fileName,
        filePath: filePath,
        size: file.size,
        sizeFormatted: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type,
        uploadedBy: session.user.email || session.user.name,
        uploadedById: session.user.id,
        uploadedAt: new Date().toISOString(),
      }
    }, { status: 201 });

  } catch (error) {
    console.error("[FILE_UPLOAD_ERROR]", error);
    
    // ✅ Better error messages
    if (error instanceof Error) {
      if (error.message.includes('ENOSPC')) {
        return NextResponse.json(
          { error: "Server storage is full" },
          { status: 507 }
        );
      }
      
      if (error.message.includes('EACCES')) {
        return NextResponse.json(
          { error: "Server permission error - contact administrator" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Error uploading file" },
      { status: 500 }
    );
  }
}