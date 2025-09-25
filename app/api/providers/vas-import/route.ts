// app/api/providers/vas-import/route.ts
import { NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { VasImportService } from "@/scripts/vas-import/VasImportService";

const PROJECT_ROOT = process.cwd();
const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts');
const ERROR_FOLDER = path.join(SCRIPTS_DIR, 'errors');

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

    if (!uploadedFilePath) {
      return NextResponse.json(
        { error: "Nije pronađena putanja fajla" },
        { status: 400 }
      );
    }

    let fileInfo = null;
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
      return NextResponse.json(
        { error: `Fajl nije pronađen: ${uploadedFilePath}` },
        { status: 404 }
      );
    }

    if (body.providerId) {
      await db.provider.update({
        where: { id: body.providerId },
        data: {
          importStatus: 'in_progress',
          lastImportDate: new Date(),
          importedBy: user.id,
          originalFileName: fileInfo.fileName,
          originalFilePath: fileInfo.filePath,
          fileSize: fileInfo.fileSize,
          mimeType: fileInfo.mimeType,
        }
      });
    }

    const vasImporter = new VasImportService(user.id);
    await vasImporter.ensureDirectories();
    
    let output = '';
    let errorOutput = '';
    let reportPath: string | null = null;

    try {
      const result = await vasImporter.processExcelFile(uploadedFilePath);
      
      if (result.records.length > 0) {
        const importResult = await vasImporter.importRecordsToDatabase(result.records);
        output = `Processed ${result.records.length} records. Inserted: ${importResult.inserted}, Updated: ${importResult.updated}, Errors: ${importResult.errors}`;
      output = importResult.logs.join('\n');
    output += `\nProcessed ${result.records.length} records. `;
    output += `Inserted: ${importResult.inserted}, `;
    output += `Updated: ${importResult.updated}, `;
    output += `Errors: ${importResult.errors}`;
      } else {
        output = "No valid records found in file";
      }

      const movedPath = await vasImporter.moveFileToProviderDirectory(
        uploadedFilePath,
        result.providerId,
        result.providerName,
        path.basename(uploadedFilePath)
      );
      
      if (movedPath) {
        const publicIndex = movedPath.indexOf('public');
        if (publicIndex !== -1) {
          reportPath = movedPath.substring(publicIndex + 6);
        }
        output += `\nFile moved to: ${movedPath}`;
      }
    } catch (error: any) {
      errorOutput = error.message || "Error processing file";
      console.error("Processing error:", error);
      
      try {
        const errorFile = path.join(ERROR_FOLDER, path.basename(uploadedFilePath));
        await fs.rename(uploadedFilePath, errorFile);
        output += `\nFile moved to error folder: ${errorFile}`;
      } catch (moveError) {
        console.error("Failed to move file to error folder:", moveError);
        output += `\nFailed to move file: ${(moveError as Error).message}`;
      }
    }

    return NextResponse.json({
      success: !errorOutput,
      output,
      error: errorOutput,
      reportPath,
      userId: user.id,
      userEmail,
      fileInfo
    });

  } catch (error: any) {
    console.error("Error in VAS import:", error);
    
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
      { error: "Greška prilikom importa VAS podataka: " + error.message },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}