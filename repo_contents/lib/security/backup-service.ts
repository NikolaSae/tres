// /lib/security/backup-service.ts
import { prisma } from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

interface BackupOptions {
  includeSchema?: boolean;
  includeData?: boolean;
  tables?: string[];
}

export async function generateDatabaseBackup(options: BackupOptions = {
  includeSchema: true,
  includeData: true,
}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups");
  const backupPath = path.join(backupDir, `backup-${timestamp}`);
  
  try {
    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });
    
    // Get DB connection string from environment
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL environment variable not found");
    }
    
    // Build pg_dump command
    let command = `pg_dump ${dbUrl}`;
    
    if (options.tables && options.tables.length > 0) {
      options.tables.forEach(table => {
        command += ` -t ${table}`;
      });
    }
    
    if (!options.includeSchema) {
      command += " --data-only";
    }
    
    if (!options.includeData) {
      command += " --schema-only";
    }
    
    command += ` > ${backupPath}.sql`;
    
    // Execute backup
    await execPromise(command);
    
    return {
      success: true,
      path: `${backupPath}.sql`,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Backup generation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date(),
    };
  }
}

export async function logBackupEvent(success: boolean, details: string) {
  return prisma.activityLog.create({
    data: {
      action: "DATABASE_BACKUP",
      entityType: "system",
      details,
      severity: success ? LogSeverity.INFO : LogSeverity.ERROR,
      userId: "system",
    }
  });
}