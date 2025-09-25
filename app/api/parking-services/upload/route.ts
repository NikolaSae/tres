// app/api/parking-services/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Niste prijavljeni" },
      { status: 401 }
    );
  }

  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const userEmail = data.get("userEmail") as string;
    const parkingServiceId = data.get("parkingServiceId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nije pronađen fajl" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xls|xlsx)$/i)) {
      return NextResponse.json(
        { error: "Dozvoljeni su samo Excel fajlovi (.xls, .xlsx)" },
        { status: 400 }
      );
    }

    // Create filename with timestamp to avoid conflicts
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = sanitizedFileName;
    
    // Ensure the scripts/input directory exists
    const inputDir = path.join(process.cwd(), "scripts", "input");
    const filePath = path.join(inputDir, fileName);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Return file information including the path for the import process
    return NextResponse.json({
      success: true,
      message: "Fajl je uspešno uploadovan",
      fileInfo: {
        originalName: file.name,
        savedName: fileName,
        filePath: filePath,
        size: file.size,
        type: file.type,
        uploadedBy: userEmail,
        uploadedAt: new Date().toISOString(),
        parkingServiceId: parkingServiceId || null
      }
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Greška prilikom uploada fajla" },
      { status: 500 }
    );
  }
}