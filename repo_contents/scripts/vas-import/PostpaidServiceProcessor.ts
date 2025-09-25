// Path: scripts/vas-import/PostpaidServiceProcessor.ts
import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import { 
  PostpaidExcelProcessor, 
  VasServiceRecord, 
  VasServiceFileProcessResult, 
  VasServiceProgressCallback 
} from './processors/PostpaidExcelProcessor';
import {
  ensureDirectories,
  normalizeProviderName
} from './utils/ParkingImportUtils';

const prisma = new PrismaClient();
const PROJECT_ROOT = process.cwd();
const FOLDER_PATH = path.join(PROJECT_ROOT, 'scripts', 'input-vas-services');
const PROCESSED_FOLDER = path.join(PROJECT_ROOT, 'scripts', 'processed-vas-services');
const ERROR_FOLDER = path.join(PROJECT_ROOT, 'scripts', 'errors-vas-services');

interface VasServiceDatabaseOperationResult {
  inserted: number;
  updated: number;
  errors: number;
  duplicates: number;
}

export class PostpaidServiceProcessor {
  private currentUserId: string;
  private progressCallback?: VasServiceProgressCallback;
  private serviceCache: Map<string, string> = new Map();
  private providerCache: Map<string, string> = new Map();
  private postpaidExcelProcessor: PostpaidExcelProcessor;

  constructor(userId?: string, progressCallback?: VasServiceProgressCallback) {
    this.currentUserId = userId || 'system-user';
    this.progressCallback = progressCallback;
    this.postpaidExcelProcessor = new PostpaidExcelProcessor(userId, progressCallback);
  }

  private log(message: string, type: 'info' | 'error' | 'success' = 'info', file?: string): void {
    console.log(`VAS_SERVICE ${type.toUpperCase()}: ${message}`);
    this.progressCallback?.onLog?.(message, type, file);
  }

  private updateProgress(fileName: string, progress: number): void {
    this.progressCallback?.onProgress?.(fileName, progress);
  }

  private updateFileStatus(fileName: string, status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'): void {
    this.progressCallback?.onFileStatus?.(fileName, status);
  }

  private async safeLogActivity(
    entityType: string,
    entityId: string,
    action: string,
    subject: string,
    description?: string,
    severity: 'INFO' | 'WARNING' | 'ERROR' = 'INFO'
  ): Promise<void> {
    try {
      await this.logActivity(entityType, entityId, action, subject, description, severity);
    } catch (error) {
      this.log(`ActivityLog fallback: ${action} - ${subject}`, 'error');
    }
  }

  private async logActivity(
    entityType: string,
    entityId: string,
    action: string,
    subject: string,
    description?: string,
    severity: 'INFO' | 'WARNING' | 'ERROR' = 'INFO'
  ): Promise<void> {
    try {
      const details = description ? `${subject}: ${description}` : subject;
      await prisma.activityLog.create({
        data: {
          action,
          entityType,
          entityId,
          details,
          severity,
          userId: this.currentUserId
        }
      });
    } catch (error) {
      this.log(`Failed to create ActivityLog: ${error}`, 'error');
    }
  }

  async ensureDirectories(): Promise<void> {
    const dirs = [FOLDER_PATH, PROCESSED_FOLDER, ERROR_FOLDER];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        this.log(`Error creating directory ${dir}: ${error}`, 'error');
      }
    }
  }

  async getOrCreateVasServiceProvider(name: string): Promise<string> {
    const normalizedName = normalizeProviderName(name);
    const cacheKey = `provider_${normalizedName}`;
    
    if (this.providerCache.has(cacheKey)) {
      return this.providerCache.get(cacheKey)!;
    }

    try {
      let provider = await prisma.vasServiceProvider.findFirst({
        where: {
          name: {
            contains: normalizedName,
            mode: 'insensitive'
          }
        }
      });

      if (!provider) {
        provider = await prisma.vasServiceProvider.create({
          data: {
            name: normalizedName,
            description: `Auto-created provider: ${normalizedName}`,
            isActive: true,
            createdBy: this.currentUserId
          }
        });

        await this.safeLogActivity(
          'VAS_SERVICE_PROVIDER',
          provider.id,
          'CREATE',
          `Created VAS service provider: ${normalizedName}`
        );

        this.log(`Created new VAS service provider: ${normalizedName}`, 'success');
      }

      this.providerCache.set(cacheKey, provider.id);
      return provider.id;
    } catch (error) {
      this.log(`Error getting/creating VAS service provider ${normalizedName}: ${error}`, 'error');
      throw error;
    }
  }

  async getOrCreateVasService(name: string, providerId: string): Promise<string> {
    const normalizedName = name.trim();
    const cacheKey = `service_${providerId}_${normalizedName}`;
    
    if (this.serviceCache.has(cacheKey)) {
      return this.serviceCache.get(cacheKey)!;
    }

    try {
      let service = await prisma.vasService.findFirst({
        where: {
          name: {
            equals: normalizedName,
            mode: 'insensitive'
          },
          providerId: providerId
        }
      });

      if (!service) {
        service = await prisma.vasService.create({
          data: {
            name: normalizedName,
            providerId: providerId,
            isActive: true,
            createdBy: this.currentUserId
          }
        });

        await this.safeLogActivity(
          'VAS_SERVICE',
          service.id,
          'CREATE',
          `Created VAS service: ${normalizedName}`
        );

        this.log(`Created new VAS service: ${normalizedName}`, 'success');
      }

      this.serviceCache.set(cacheKey, service.id);
      return service.id;
    } catch (error) {
      this.log(`Error getting/creating VAS service ${normalizedName}: ${error}`, 'error');
      throw error;
    }
  }

  async saveVasServiceRecordsToDatabase(
    records: VasServiceRecord[],
    fileName: string
  ): Promise<VasServiceDatabaseOperationResult> {
    const result: VasServiceDatabaseOperationResult = {
      inserted: 0,
      updated: 0,
      errors: 0,
      duplicates: 0
    };

    this.log(`Starting database operations for ${records.length} VAS service records`, 'info', fileName);
    
    const batchSize = 100;
    const totalBatches = Math.ceil(records.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, records.length);
      const batch = records.slice(start, end);

      this.log(`Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} records)`, 'info', fileName);
      
      const progress = Math.round(((batchIndex + 1) / totalBatches) * 100);
      this.updateProgress(fileName, progress);

      for (const record of batch) {
        try {
          // Ensure provider and service exist
          const providerId = await this.getOrCreateVasServiceProvider(record.providerName);
          const serviceId = await this.getOrCreateVasService(record.serviceName, providerId);

          // Check if record already exists
          const existingRecord = await prisma.vasServiceUsage.findFirst({
            where: {
              serviceId: serviceId,
              msisdn: record.msisdn,
              transactionDate: record.transactionDate,
              amount: record.amount,
              transactionId: record.transactionId || undefined
            }
          });

          if (existingRecord) {
            result.duplicates++;
            continue;
          }

          // Create new record
          const newRecord = await prisma.vasServiceUsage.create({
            data: {
              serviceId: serviceId,
              msisdn: record.msisdn,
              transactionDate: record.transactionDate,
              amount: record.amount,
              currency: record.currency || 'RSD',
              transactionId: record.transactionId,
              description: record.description,
              additionalData: record.additionalData ? JSON.stringify(record.additionalData) : null,
              createdBy: this.currentUserId
            }
          });

          result.inserted++;

        } catch (error) {
          result.errors++;
          this.log(`Error processing record for MSISDN ${record.msisdn}: ${error}`, 'error', fileName);
        }
      }
    }

    this.log(`Database operations completed: ${result.inserted} inserted, ${result.duplicates} duplicates, ${result.errors} errors`, 'success', fileName);
    return result;
  }

  async processVasServiceFile(filePath: string): Promise<VasServiceFileProcessResult> {
    const fileName = path.basename(filePath);
    this.log(`Starting VAS service file processing: ${fileName}`, 'info', fileName);
    this.updateFileStatus(fileName, 'processing');

    try {
      // Process Excel file
      const excelResult = await this.postpaidExcelProcessor.processExcelFile(filePath);
      
      if (!excelResult.success || !excelResult.records || excelResult.records.length === 0) {
        throw new Error(`No valid VAS service records found in file: ${excelResult.error || 'Unknown error'}`);
      }

      this.log(`Processed ${excelResult.records.length} VAS service records from Excel`, 'success', fileName);

      // Save to database
      const dbResult = await this.saveVasServiceRecordsToDatabase(excelResult.records, fileName);

      // Move processed file
      const processedPath = path.join(PROCESSED_FOLDER, `processed_${Date.now()}_${fileName}`);
      await fs.copyFile(filePath, processedPath);
      await fs.unlink(filePath);

      this.updateFileStatus(fileName, 'completed');

      return {
        success: true,
        fileName,
        totalRecords: excelResult.records.length,
        processedRecords: dbResult.inserted + dbResult.updated,
        errors: dbResult.errors,
        duplicates: dbResult.duplicates,
        details: {
          inserted: dbResult.inserted,
          updated: dbResult.updated,
          errors: dbResult.errors,
          duplicates: dbResult.duplicates
        }
      };

    } catch (error) {
      this.log(`Error processing VAS service file ${fileName}: ${error}`, 'error', fileName);
      this.updateFileStatus(fileName, 'error');

      // Move error file
      try {
        const errorPath = path.join(ERROR_FOLDER, `error_${Date.now()}_${fileName}`);
        await fs.copyFile(filePath, errorPath);
        await fs.unlink(filePath);
      } catch (moveError) {
        this.log(`Failed to move error file: ${moveError}`, 'error', fileName);
      }

      return {
        success: false,
        fileName,
        error: error instanceof Error ? error.message : String(error),
        totalRecords: 0,
        processedRecords: 0,
        errors: 1,
        duplicates: 0
      };
    }
  }

  async processVasServiceFiles(fileOrFiles?: string | string[]): Promise<VasServiceFileProcessResult[]> {
    await this.ensureDirectories();

    let filesToProcess: string[] = [];

    if (typeof fileOrFiles === 'string') {
      filesToProcess = [fileOrFiles];
    } else if (Array.isArray(fileOrFiles)) {
      filesToProcess = fileOrFiles;
    } else {
      // Process all files in input directory
      try {
        const files = await fs.readdir(FOLDER_PATH);
        filesToProcess = files
          .filter(file => file.toLowerCase().endsWith('.xlsx') || file.toLowerCase().endsWith('.xls'))
          .map(file => path.join(FOLDER_PATH, file));
      } catch (error) {
        this.log(`Error reading input directory: ${error}`, 'error');
        return [{
          success: false,
          fileName: 'directory_scan',
          error: `Failed to read input directory: ${error}`,
          totalRecords: 0,
          processedRecords: 0,
          errors: 1,
          duplicates: 0
        }];
      }
    }

    if (filesToProcess.length === 0) {
      this.log('No VAS service files found to process', 'info');
      return [];
    }

    this.log(`Found ${filesToProcess.length} VAS service files to process`, 'info');

    const results: VasServiceFileProcessResult[] = [];

    for (const filePath of filesToProcess) {
      const result = await this.processVasServiceFile(filePath);
      results.push(result);
    }

    // Summary
    const totalFiles = results.length;
    const successfulFiles = results.filter(r => r.success).length;
    const totalRecords = results.reduce((sum, r) => sum + r.totalRecords, 0);
    const totalProcessed = results.reduce((sum, r) => sum + r.processedRecords, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
    const totalDuplicates = results.reduce((sum, r) => sum + r.duplicates, 0);

    this.log(`VAS Service Processing Summary:`, 'success');
    this.log(`- Files: ${successfulFiles}/${totalFiles} successful`, 'info');
    this.log(`- Records: ${totalProcessed}/${totalRecords} processed`, 'info');
    this.log(`- Duplicates: ${totalDuplicates}`, 'info');
    this.log(`- Errors: ${totalErrors}`, 'info');

    return results;
  }

  async cleanup(): Promise<void> {
    try {
      await prisma.$disconnect();
      this.serviceCache.clear();
      this.providerCache.clear();
    } catch (error) {
      this.log(`Error during cleanup: ${error}`, 'error');
    }
  }
}

// Export for use in API routes
export default PostpaidServiceProcessor;