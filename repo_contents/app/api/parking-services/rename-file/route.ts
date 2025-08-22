// app/api/parking-services/rename-file/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Niste prijavljeni" }, { status: 401 });
  }

  try {
    const { filePath, parkingServiceId } = await request.json();

    if (!filePath || !parkingServiceId) {
      return NextResponse.json({ error: "Nedostaju podaci" }, { status: 400 });
    }

    const originalName = path.basename(filePath);
    const ext = path.extname(originalName);
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const newFileName = `${parkingServiceId}_${timestamp}${ext}`;

    const inputDir = path.join(process.cwd(), "scripts", "input");
    const newPath = path.join(inputDir, newFileName);

    await fs.rename(filePath, newPath);

    return NextResponse.json({
      success: true,
      message: "Fajl je uspešno preimenovan",
      newFilePath: newPath,
      newFileName: newFileName,
    });
  } catch (error) {
    console.error("Greška prilikom preimenovanja:", error);
    return NextResponse.json(
      { error: "Greška prilikom preimenovanja fajla" },
      { status: 500 }
    );
  }
}
