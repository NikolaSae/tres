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

    // Find user in database
    const user = await db.user.findUnique({
      where: { email: userEmail },
      select: { id: true, name: true, email: true }
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

    // Check if file exists
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

    // Initialize VAS importer
    const vasImporter = new VasImportService(user.id);
    await vasImporter.ensureDirectories();
    
    let output = '';
    let errorOutput = '';
    let reportPath: string | null = null;
    let parseInfo = null;

    try {
      // Parse and process file
      console.log(`\n🚀 Starting import for: ${fileInfo.fileName}`);
      console.log(`   User: ${user.name} (${user.email})`);
      
      const result = await vasImporter.processExcelFile(uploadedFilePath);
      
      // Store parse info for response
      parseInfo = {
        provider: result.providerName,
        providerId: result.providerId,
        recordCount: result.records.length
      };
      
      // Build initial output with file info
      const outputLines: string[] = [
        `📋 File: ${fileInfo.fileName}`,
        `📁 Size: ${(fileInfo.fileSize / 1024).toFixed(2)} KB`,
        ``,
      ];
      
      // Add import logs from processing (contains contract info)
      if (result.importLogs && result.importLogs.length > 0) {
        outputLines.push(...result.importLogs);
        outputLines.push('');
      }
      
      // Process records if any found
      if (result.records.length > 0) {
        outputLines.push(`📊 Found ${result.records.length} records to process`);
        outputLines.push('');
        
        const importResult = await vasImporter.importRecordsToDatabase(result.records);
        
        // Add import logs
        outputLines.push(...importResult.logs);
        outputLines.push('');
        
        // Add summary
        outputLines.push('📈 Import Summary:');
        outputLines.push(`   ✅ Inserted: ${importResult.inserted}`);
        outputLines.push(`   🔄 Updated: ${importResult.updated}`);
        outputLines.push(`   ❌ Errors: ${importResult.errors}`);
        outputLines.push('');
        
        // Update provider status to success
        if (body.providerId) {
          await db.provider.update({
            where: { id: body.providerId },
            data: {
              importStatus: 'completed',
              lastImportDate: new Date(),
              importedBy: user.id,
              originalFileName: fileInfo.fileName,
              originalFilePath: fileInfo.filePath,
              fileSize: fileInfo.fileSize,
              mimeType: fileInfo.mimeType,
            }
          });
        }
      } else {
        outputLines.push('⚠️  No valid records found in file');
        errorOutput = 'No valid records found';
      }

      // Move file to provider directory
      const movedPath = await vasImporter.moveFileToProviderDirectory(
        uploadedFilePath,
        result.providerId,
        result.providerName,
        path.basename(uploadedFilePath)
      );
      
      if (movedPath) {
        // Extract relative path from public folder
        const publicIndex = movedPath.indexOf('public');
        if (publicIndex !== -1) {
          reportPath = movedPath.substring(publicIndex + 6); // +6 to skip 'public'
        }
        
        outputLines.push(`✅ File moved to: ${movedPath.replace(PROJECT_ROOT, '')}`);
        
        if (reportPath) {
          outputLines.push(`🔗 Report path: ${reportPath}`);
        }
      }
      
      output = outputLines.join('\n');
      
    } catch (error: any) {
      errorOutput = error.message || "Error processing file";
      console.error("❌ Processing error:", error);
      
      output = `❌ Error: ${errorOutput}\n\nStack trace:\n${error.stack || 'No stack trace available'}`;
      
      // Move file to error folder
      try {
        const errorFile = path.join(ERROR_FOLDER, path.basename(uploadedFilePath));
        await fs.rename(uploadedFilePath, errorFile);
        output += `\n\n📁 File moved to error folder: ${errorFile}`;
      } catch (moveError) {
        console.error("Failed to move file to error folder:", moveError);
        output += `\n\n⚠️  Failed to move file: ${(moveError as Error).message}`;
      }
      
      // Update provider status to failed
      if (body.providerId) {
        try {
          await db.provider.update({
            where: { id: body.providerId },
            data: {
              importStatus: 'failed',
              lastImportDate: new Date(),
              importedBy: user.id,
              originalFileName: fileInfo.fileName,
              originalFilePath: fileInfo.filePath,
              fileSize: fileInfo.fileSize,
              mimeType: fileInfo.mimeType,
            }
          });
        } catch (dbError) {
          console.error("Failed to update provider status:", dbError);
        }
      }
    }

    return NextResponse.json({
      success: !errorOutput,
      output,
      error: errorOutput || null,
      reportPath,
      userId: user.id,
      userEmail: user.email,
      fileInfo,
      parseInfo
    });

  } catch (error: any) {
    console.error("❌ Error in VAS import API:", error);
    
    return NextResponse.json(
      { 
        error: "Greška prilikom importa VAS podataka: " + error.message,
        success: false,
        output: `❌ Fatal error: ${error.message}`,
        stack: error.stack
      },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}