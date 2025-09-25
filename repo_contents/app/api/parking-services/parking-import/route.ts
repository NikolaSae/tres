// app/api/parking-services/parking-import/route.ts
import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import { auth } from "@/auth";
import { db } from "@/lib/db";


export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Niste prijavljeni" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const userEmail = body.userEmail || session.user.email;
    const uploadedFilePath = body.uploadedFilePath;

    // Look up user
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

    // Get file info
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

    // Update import status ONLY if service ID provided
    if (body.parkingServiceId) {
      await prisma.parkingService.update({
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

    return new Promise((resolve) => {
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

      pythonProcess.on("close", async (code) => {
        const isSuccess = code === 0;
        
        // Update import status ONLY if service ID provided
        if (body.parkingServiceId) {
          try {
            await prisma.parkingService.update({
              where: { id: body.parkingServiceId },
              data: {
                importStatus: isSuccess ? 'success' : 'failed',
                lastImportDate: new Date(),
              }
            });
          } catch (dbError) {
            console.error("Failed to update import status:", dbError);
          }
        }

        // REMOVED SERVICE CREATION LOGIC HERE
        // Service creation now only happens elsewhere

        resolve(
          NextResponse.json({
            success: isSuccess,
            output: combinedOutput,
            error: errorOutput,
            exitCode: code,
            userId: user.id,
            userEmail,
            fileInfo
          })
        );
      });
    });

  } catch (error) {
    console.error("Error in parking import:", error);
    
    // Update status ONLY if service ID provided
    const body = await req.json().catch(() => ({}));
    if (body.parkingServiceId) {
      try {
        await prisma.parkingService.update({
          where: { id: body.parkingServiceId },
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
