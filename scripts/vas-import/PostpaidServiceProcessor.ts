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

  // ✅ UKLONJEN parkingServiceId
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

  async getOrCreateProvider(name: string): Promise<string> {
    const normalizedName = normalizeProviderName(name);
    const cacheKey = `provider_${normalizedName}`;

    if (this.providerCache.has(cacheKey)) {
      return this.providerCache.get(cacheKey)!;
    }

    try {
      let provider = await prisma.provider.findFirst({
        where: {
          name: {
            contains: normalizedName,
            mode: 'insensitive'
          }
        }
      });

      if (!provider) {
        provider = await prisma.provider.create({
          data: {
            name: normalizedName,
            contactName: `Auto-created provider: ${normalizedName}`,
            isActive: true,
          }
        });

        await this.safeLogActivity(
          'PROVIDER',
          provider.id,
          'CREATE',
          `Created provider: ${normalizedName}`
        );

        this.log(`Created new provider: ${normalizedName}`, 'success');
      }

      this.providerCache.set(cacheKey, provider.id);
      return provider.id;
    } catch (error) {
      this.log(`Error getting/creating provider ${normalizedName}: ${error}`, 'error');
      throw error;
    }
  }

  // ✅ DODAJ funkciju za kreiranje ili pronalaženje Service-a
  async getOrCreateService(productName: string): Promise<string> {
    const cacheKey = `service_${productName}`;

    if (this.serviceCache.has(cacheKey)) {
      return this.serviceCache.get(cacheKey)!;
    }

    try {
      let service = await prisma.service.findFirst({
        where: {
          name: productName,
          type: 'VAS'
        }
      });

      if (!service) {
        service = await prisma.service.create({
          data: {
            name: productName,
            type: 'VAS',
            isActive: true,
            createdById: this.currentUserId
          }
        });

        this.log(`Created new VAS service: ${productName}`, 'success');
      }

      this.serviceCache.set(cacheKey, service.id);
      return service.id;
    } catch (error) {
      this.log(`Error getting/creating service ${productName}: ${error}`, 'error');
      throw error;
    }
  }

  async saveVasServiceRecordsToDatabase(
    records: VasServiceRecord[],
    fileName: string,
    providerName: string
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

    // Get or create provider
    const providerId = await this.getOrCreateProvider(providerName);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, records.length);
      const batch = records.slice(start, end);

      this.log(`Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} records)`, 'info', fileName);

      const progress = Math.round(((batchIndex + 1) / totalBatches) * 100);
      this.updateProgress(fileName, progress);

      for (const record of batch) {
        try {
          // ✅ Kreiraj ili pronađi Service za ovaj proizvod
          const serviceId = await this.getOrCreateService(record.proizvod);

          // Check if record already exists
          const existingRecord = await prisma.vasService.findFirst({
            where: {
              proizvod: record.proizvod,
              mesec_pruzanja_usluge: record.mesec_pruzanja_usluge,
              provajderId: providerId
            }
          });

          if (existingRecord) {
            result.duplicates++;
            continue;
          }

          // ✅ Create new VasService record sa serviceId
          await prisma.vasService.create({
            data: {
              proizvod: record.proizvod,
              mesec_pruzanja_usluge: record.mesec_pruzanja_usluge,
              jedinicna_cena: record.jedinicna_cena,
              broj_transakcija: record.broj_transakcija,
              fakturisan_iznos: record.fakturisan_iznos,
              fakturisan_korigovan_iznos: record.fakturisan_korigovan_iznos,
              naplacen_iznos: record.naplacen_iznos,
              kumulativ_naplacenih_iznosa: record.kumulativ_naplacenih_iznosa,
              nenaplacen_iznos: record.nenaplacen_iznos,
              nenaplacen_korigovan_iznos: record.nenaplacen_korigovan_iznos,
              storniran_iznos: record.storniran_iznos,
              otkazan_iznos: record.otkazan_iznos,
              kumulativ_otkazanih_iznosa: record.kumulativ_otkazanih_iznosa,
              iznos_za_prenos_sredstava: record.iznos_za_prenos_sredstava,
              serviceId: serviceId, // ✅ Koristi kreiran serviceId
              provajderId: providerId,
            }
          });

          result.inserted++;

        } catch (error) {
          result.errors++;
          this.log(`Error processing record for product ${record.proizvod}: ${error}`, 'error', fileName);
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
      // ✅ Process Excel file BEZ parkingServiceId
      const excelResult = await this.postpaidExcelProcessor.processPostpaidExcelFile(filePath);

      if (!excelResult.records || excelResult.records.length === 0) {
        throw new Error('No valid VAS service records found in file');
      }

      this.log(`Processed ${excelResult.records.length} VAS service records from Excel`, 'success', fileName);

      // Save to database
      const dbResult = await this.saveVasServiceRecordsToDatabase(
        excelResult.records,
        fileName,
        excelResult.providerName
      );

      // Move processed file
      const processedPath = path.join(PROCESSED_FOLDER, `processed_${Date.now()}_${fileName}`);
      await fs.copyFile(filePath, processedPath);
      await fs.unlink(filePath);

      this.updateFileStatus(fileName, 'completed');

      return excelResult;

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

      throw error;
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
        return [];
      }
    }

    if (filesToProcess.length === 0) {
      this.log('No VAS service files found to process', 'info');
      return [];
    }

    this.log(`Found ${filesToProcess.length} VAS service files to process`, 'info');

    const results: VasServiceFileProcessResult[] = [];

    for (const filePath of filesToProcess) {
      try {
        const result = await this.processVasServiceFile(filePath);
        results.push(result);
      } catch (error) {
        this.log(`Failed to process file ${filePath}: ${error}`, 'error');
      }
    }

    // Summary
    const totalFiles = results.length;
    const totalRecords = results.reduce((sum, r) => sum + r.records.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

    this.log(`VAS Service Processing Summary:`, 'success');
    this.log(`- Files: ${totalFiles} processed`, 'info');
    this.log(`- Records: ${totalRecords} total`, 'info');
    this.log(`- Warnings: ${totalWarnings}`, 'info');

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