// app/api/providers/vas-import/route.ts
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

    const scriptPath = path.join(process.cwd(), "scripts", "vas_provider_processor.py");

    // Verify script exists
    try {
      await fs.access(scriptPath);
    } catch (error) {
      return NextResponse.json(
        { error: `Python skripta nije pronađena na lokaciji: ${scriptPath}` },
        { status: 404 }
      );
    }

    // Update import status if provider ID provided
    if (body.providerId) {
      await db.provider.update({
        where: { id: body.providerId },
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
      // Use explicit Python path from environment variable or default to system Python
      const pythonPath = path.join(process.cwd(), ".venv", "Scripts", "python.exe");
      
      const pythonProcess = spawn(pythonPath, [scriptPath, user.id], {
  env: {
    ...process.env,
    PYTHONPATH: path.join(process.cwd(), "scripts"),
    PATH: `${path.join(process.cwd(), ".venv", "Scripts")};${process.env.PATH}`
  }
});

      let combinedOutput = "";
      let errorOutput = "";

      pythonProcess.stdout.on("data", (data) => {
        combinedOutput += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        const errorMessage = data.toString();
        console.error("Python Error:", errorMessage);
        
        // Handle specific module errors
        if (errorMessage.includes("ModuleNotFoundError")) {
          errorOutput = `Python moduli nisu instalirani. Pokrenite: ${pythonPath} -m pip install pandas psycopg2-binary openpyxl python-dotenv`;
        } else {
          errorOutput += errorMessage;
        }
        combinedOutput += errorMessage;
      });

      pythonProcess.on("close", async (code) => {
        const isSuccess = code === 0;
        
        // Update import status if provider ID provided
        if (body.providerId) {
          try {
            await db.provider.update({
              where: { id: body.providerId },
              data: {
                importStatus: isSuccess ? 'completed' : 'failed',
                lastImportDate: new Date(),
              }
            });
          } catch (dbError) {
            console.error("Failed to update import status:", dbError);
          }
        }

        resolve(
          NextResponse.json({
            success: isSuccess,
            output: combinedOutput,
            error: errorOutput,
            exitCode: code,
            userId: user.id,
            userEmail,
            fileInfo,
            pythonPathUsed: pythonPath
          })
        );
      });
    });

  } catch (error) {
    console.error("Error in VAS import:", error);
    
    // Update status if provider ID provided
    const body = await req.json().catch(() => ({}));
    if (body.providerId) {
      try {
        await db.provider.update({
          where: { id: body.providerId },
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
      { error: "Greška prilikom importa VAS podataka" },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}