// app/api/parking-services/parking-import/route.ts
import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import { auth } from "@/auth";
import { db } from "@/lib/db";


// app/api/parking-services/parking-import/route.ts
// ... imports remain the same

export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Niste prijavljeni" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    const userEmail = body.userEmail || session.user.email;
    const uploadedFilePath = body.uploadedFilePath;

    const user = await db.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Korisnik nije pronađen u bazi podataka" },
        { status: 404 }
      );
    }

    // Get file info (unchanged)
    let fileInfo = null;
    if (uploadedFilePath) {
      try {
        const stats = await fs.stat(uploadedFilePath);
        fileInfo = {
          filePath: uploadedFilePath,
          fileName: path.basename(uploadedFilePath),
          fileSize: stats.size,
          mimeType: uploadedFilePath.endsWith('.xlsx') 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/vnd.ms-excel'
        };
      } catch (error) {
        console.warn("Could not get file info:", error);
      }
    }

    const scriptPath = path.join(process.cwd(), "scripts", "parking_service_processor.py");

    // Update status if service ID provided (unchanged)
    if (body.parkingServiceId) {
      await db.parkingService.update({
        where: { id: body.parkingServiceId },
        data: {
          importStatus: 'in_progress',
          lastImportDate: new Date(),
          importedBy: user.id,
          ...(fileInfo && {
            originalFileName: fileInfo.fileName,
            originalFilePath: fileInfo.filePath,
            fileSize: fileInfo.fileSize,
            mimeType: fileInfo.mimeType,
          })
        }
      });
    }

    // ────────────────────────────────────────────────
    // Key change: Wait for python process using a Promise
    // ────────────────────────────────────────────────
    const { success, output, errorOutput, exitCode } = await new Promise<{
      success: boolean;
      output: string;
      errorOutput: string;
      exitCode: number | null;
    }>((resolve) => {
      const pythonProcess = spawn("python", [scriptPath, user.id], {
        env: {
          ...process.env,
          SUPABASE_PASSWORD: process.env.SUPABASE_PASSWORD || "",
          UPLOADED_FILE_PATH: uploadedFilePath || "",
        },
      });

      let combinedOutput = "";
      let errorOutput = "";

      pythonProcess.stdout.on("data", (data) => {
        combinedOutput += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
        combinedOutput += data.toString();
      });

      pythonProcess.on("close", (code) => {
        const isSuccess = code === 0;
        resolve({
          success: isSuccess,
          output: combinedOutput,
          errorOutput,
          exitCode: code,
        });
      });

      // Optional: handle error / spawn failure
      pythonProcess.on("error", (err) => {
        resolve({
          success: false,
          output: "",
          errorOutput: err.message,
          exitCode: null,
        });
      });
    });

    // Update final status if service ID provided
    if (body.parkingServiceId) {
      try {
        await db.parkingService.update({
          where: { id: body.parkingServiceId },
          data: {
            importStatus: success ? 'success' : 'failed',
            lastImportDate: new Date(),
          }
        });
      } catch (dbError) {
        console.error("Failed to update import status:", dbError);
      }
    }

    return NextResponse.json({
      success,
      output,
      error: errorOutput,
      exitCode,
      userId: user.id,
      userEmail,
      fileInfo
    });

  } catch (error) {
    console.error("Error in parking import:", error);

    // Try to parse body again only if needed (safer)
    let parkingServiceId;
    try {
      const parsed = await req.json().catch(() => ({}));
      parkingServiceId = parsed.parkingServiceId;
    } catch {}

    if (parkingServiceId) {
      try {
        await db.parkingService.update({
          where: { id: parkingServiceId },
          data: {
            importStatus: 'failed',
            lastImportDate: new Date(),
          }
        });
      } catch (dbError) {
        console.error("Failed to update import status on error:", dbError);
      }
    }

    return NextResponse.json(
      { error: "Greška prilikom importa parking servisa" },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}