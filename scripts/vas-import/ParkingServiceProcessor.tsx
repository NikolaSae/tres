// Path: scripts/vas-import/ParkingServiceProcessor.tsx
import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import { ExcelProcessor, ParkingRecord, FileProcessResult, ProgressCallback } from './processors/ExcelProcessor';
import {
  ensureDirectories,
  normalizeProviderName,
  extractServiceCode,
  createParkingServiceDirectory
} from './utils/ParkingImportUtils';

const prisma = new PrismaClient();

const PROJECT_ROOT = process.cwd();
const FOLDER_PATH = path.join(PROJECT_ROOT, 'scripts', 'input');
const PROCESSED_FOLDER = path.join(PROJECT_ROOT, 'scripts', 'processed');
const ERROR_FOLDER = path.join(PROJECT_ROOT, 'scripts', 'errors');

interface DatabaseOperationResult {
  inserted: number;
  updated: number;
  errors: number;
  duplicates: number;
}

export class ParkingServiceProcessor {
  private currentUserId: string;
  private progressCallback?: ProgressCallback;
  private serviceCache: Map<string, string> = new Map();
  private parkingServiceCache: Map<string, string> = new Map();
  private excelProcessor: ExcelProcessor;

  constructor(userId?: string, progressCallback?: ProgressCallback) {
    this.currentUserId = userId || 'system-user';
    this.progressCallback = progressCallback;
    this.excelProcessor = new ExcelProcessor(userId, progressCallback);
  }

  private log(message: string, type: 'info' | 'error' | 'success' = 'info', file?: string): void {
    console.log(`${type.toUpperCase()}: ${message}`);
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


  private mergeParkingRecords(records: ParkingRecord[]): ParkingRecord[] {
  const mergedMap = new Map<string, ParkingRecord>();

  for (const record of records) {
    const dateKey = record.date.toISOString().split('T')[0];
    const key = `${dateKey}_${record.serviceName}_${record.group}`;
    
    if (mergedMap.has(key)) {
      const existing = mergedMap.get(key)!;
      
      const newQuantity = existing.quantity + record.quantity;
      const newAmount = existing.amount + record.amount;
      const newPrice = newQuantity > 0 ? newAmount / newQuantity : 0;

      existing.quantity = newQuantity;
      existing.amount = newAmount;
      existing.price = newPrice;
    } else {
      mergedMap.set(key, { ...record });
    }
  }

  return Array.from(mergedMap.values());
}

  async processMultipleFiles(inputFiles: string[]): Promise<{
  totalProcessed: number;
  totalImported: number;
  totalUpdated: number;
  totalErrors: number;
  results: Array<{
    file: string;
    success: boolean;
    result?: any;
    error?: string;
  }>;
}> {
  const results = [];
  let totalProcessed = 0;
  let totalImported = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  for (const inputFile of inputFiles) {
    try {
      const result = await this.processFileWithImport(inputFile);
      
      results.push({
        file: path.basename(inputFile),
        success: true,
        result
      });
      
      totalProcessed += result.recordsProcessed;
      totalImported += result.imported;
      totalUpdated += result.updated;
      totalErrors += result.errors;
      
    } catch (error) {
      results.push({
        file: path.basename(inputFile),
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      totalErrors++;
    }
  }

  return {
    totalProcessed,
    totalImported,
    totalUpdated,
    totalErrors,
    results
  };
}

async cleanupOldFiles(daysOld: number = 30): Promise<{
  processedCleaned: number;
  errorsCleaned: number;
}> {
  let processedCleaned = 0;
  let errorsCleaned = 0;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  try {
    // Clean processed folder
    const processedFiles = await fs.readdir(PROCESSED_FOLDER);
    for (const file of processedFiles) {
      const filePath = path.join(PROCESSED_FOLDER, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        processedCleaned++;
      }
    }

    // Clean error folder
    const errorFiles = await fs.readdir(ERROR_FOLDER);
    for (const file of errorFiles) {
      const filePath = path.join(ERROR_FOLDER, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        errorsCleaned++;
      }
    }
  } catch (error) {
    this.log(`Cleanup error: ${error}`, 'error');
  }

  return { processedCleaned, errorsCleaned };
}

async validateFile(filePath: string): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    size: number;
    extension: string;
    basename: string;
  };
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const stats = await fs.stat(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath);

    // Check file exists
    if (!stats.isFile()) {
      errors.push('Path is not a file');
    }

    // Check file size (max 50MB)
    if (stats.size > 50 * 1024 * 1024) {
      errors.push('File size exceeds 50MB');
    }

    // Check extension
    if (!['.xlsx', '.xls'].includes(extension)) {
      errors.push('File must be Excel format (.xlsx or .xls)');
    }

    // Check filename pattern
    if (!basename.match(/\d{8}/)) {
      warnings.push('Filename does not contain date pattern (YYYYMMDD)');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      fileInfo: {
        size: stats.size,
        extension,
        basename
      }
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`File validation error: ${error instanceof Error ? error.message : String(error)}`],
      warnings: [],
      fileInfo: {
        size: 0,
        extension: '',
        basename: path.basename(filePath)
      }
    };
  }
}

async getProcessingStats(): Promise<{
  totalTransactions: number;
  totalServices: number;
  totalParkingServices: number;
  recentImports: Array<{
    date: Date;
    fileName: string;
    recordsCount: number;
  }>;
}> {
  try {
    const [totalTransactions, totalServices, totalParkingServices, recentLogs] = await Promise.all([
      prisma.parkingTransaction.count(),
      prisma.service.count({ where: { type: 'PARKING' } }),
      prisma.parkingService.count(),
      prisma.activityLog.findMany({
        where: {
          action: 'IMPORT_PARKING',
          entityType: 'ParkingTransaction'
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          createdAt: true,
          details: true
        }
      })
    ]);

    const recentImports = recentLogs.map(log => {
      // Parse details to extract filename and count
      const fileMatch = log.details?.match(/file: ([^\s]+)/i);
      const countMatch = log.details?.match(/(\d+) records/i);
      
      return {
        date: log.createdAt,
        fileName: fileMatch?.[1] || 'Unknown',
        recordsCount: countMatch ? parseInt(countMatch[1]) : 0
      };
    });

    return {
      totalTransactions,
      totalServices,
      totalParkingServices,
      recentImports
    };
  } catch (error) {
    this.log(`Failed to get processing stats: ${error}`, 'error');
    return {
      totalTransactions: 0,
      totalServices: 0,
      totalParkingServices: 0,
      recentImports: []
    };
  }
}

async getOrCreateSystemUser(): Promise<string> {
  try {
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@parking.local' }
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: 'system@parking.local',
          name: 'System User',
          role: 'ADMIN' // ← Promenjen sa 'SYSTEM' na 'ADMIN'
        }
      });
    }

    return systemUser.id;
  } catch (error) {
    this.log(`Failed to get/create system user: ${error}`, 'error');
    return 'system-fallback-id';
  }
}

  async getOrCreateParkingService(name: string): Promise<{ id: string; created: boolean }> {
  const normalizedName = normalizeProviderName(name);
  
  if (this.parkingServiceCache.has(normalizedName)) {
    return { id: this.parkingServiceCache.get(normalizedName)!, created: false };
  }

  let parkingService = await prisma.parkingService.findFirst({
    where: { name: normalizedName }
  });

  if (!parkingService) {
    parkingService = await prisma.parkingService.create({
      data: {
        name: normalizedName,
        isActive: true,
        createdById: this.currentUserId
      }
    });
    this.log(`Created new parking service: ${normalizedName}`, 'success');
  }

  this.parkingServiceCache.set(normalizedName, parkingService.id);
  return { id: parkingService.id, created: !parkingService };
}

  async getOrCreateService(serviceCode: string): Promise<{ id: string; created: boolean }> {
    if (this.serviceCache.has(serviceCode)) {
      return { id: this.serviceCache.get(serviceCode)!, created: false };
    }

    let service = await prisma.service.findFirst({
      where: { name: serviceCode }
    });

    if (service) {
      this.serviceCache.set(serviceCode, service.id);
      return { id: service.id, created: false };
    }

    service = await prisma.service.create({
      data: {
        name: serviceCode,
        type: 'PARKING',
        billingType: 'PREPAID',
        description: `Auto-created parking service: ${serviceCode}`,
        isActive: true,
      }
    });

    this.serviceCache.set(serviceCode, service.id);

    await this.safeLogActivity(
      'Service',
      service.id,
      'CREATE',
      `Created service ${serviceCode}`
    );

    return { id: service.id, created: true };
  }

  async getOrCreateServiceContract(serviceId: string, parkingServiceId: string): Promise<{ id: string; created: boolean }> {
  let contract = await prisma.contract.findFirst({
    where: { 
      parkingServiceId,
      type: 'PARKING',
      status: 'ACTIVE'
    }
  });

  if (!contract) {
    contract = await prisma.contract.create({
      data: {
        name: `Auto-generated parking contract`,
        contractNumber: `PARKING-${Date.now().toString().slice(-6)}`,
        type: 'PARKING',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        revenuePercentage: 10.0,
        parkingServiceId: parkingServiceId,
        createdById: this.currentUserId
      }
    });
  }

  const existing = await prisma.serviceContract.findFirst({
    where: {
      serviceId,
      contractId: contract.id
    }
  });

  if (existing) {
    return { id: existing.id, created: false };
  }

  const serviceContract = await prisma.serviceContract.create({
    data: {
      serviceId,
      contractId: contract.id
    }
  });

  await this.safeLogActivity(
    'ServiceContract',
    serviceContract.id,
    'CREATE',
    'Created service contract connection'
  );

  return { id: serviceContract.id, created: true };
}

  private async createServiceMappings(
  serviceNames: Set<string>, 
  parkingServiceId: string
): Promise<Record<string, string>> {
  const serviceIdMapping: Record<string, string> = {};
  
  for (const serviceName of serviceNames) {
    const serviceCode = serviceName.trim();
    
    if (this.serviceCache.has(serviceCode)) {
      serviceIdMapping[serviceName] = this.serviceCache.get(serviceCode)!;
      continue;
    }

    let service = await prisma.service.findFirst({
      where: { name: serviceCode }
    });

    if (!service) {
      service = await prisma.service.create({
        data: {
          name: serviceCode,
          type: 'PARKING',
          billingType: 'PREPAID',
          description: `Usluga parkinga: ${serviceCode}`,
          isActive: true,
        }
      });
      this.log(`Kreirana nova usluga: ${serviceCode}`, 'success');
    }

    await this.getOrCreateServiceContract(service.id, parkingServiceId);
    
    serviceIdMapping[serviceName] = service.id;
    this.serviceCache.set(serviceCode, service.id);
  }

  return serviceIdMapping;
}

  async importRecordsToDatabase(records: ParkingRecord[], filename?: string): Promise<DatabaseOperationResult> {
  const mergedRecords = this.mergeParkingRecords(records);
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const record of mergedRecords) {
    try {
      if (!record.parkingServiceId || !record.serviceId || !record.date) {
        throw new Error("Missing required fields");
      }

      const operation = await prisma.parkingTransaction.upsert({
        where: {
          parkingServiceId_date_serviceName_group: {
            parkingServiceId: record.parkingServiceId,
            date: record.date,
            serviceName: record.serviceName,
            group: record.group
          }
        },
        update: {
          price: record.price,
          quantity: record.quantity,
          amount: record.amount,
          serviceId: record.serviceId
        },
        create: {
          parkingServiceId: record.parkingServiceId,
          serviceId: record.serviceId,
          date: record.date,
          group: record.group,
          serviceName: record.serviceName,
          price: record.price,
          quantity: record.quantity,
          amount: record.amount
        }
      });

      if (operation.createdAt.getTime() === operation.updatedAt.getTime()) {
        inserted++;
      } else {
        updated++;
      }
       
    } catch (error) {
      errors++;
      this.log(`Error saving record: ${record.serviceName} - ${error instanceof Error ? error.message : String(error)}`, 'error', filename);
    }
  }

  return { 
    inserted, 
    updated, 
    errors, 
    duplicates: records.length - mergedRecords.length 
  };
}

  // NEW: Save original file to required directory structure
  private async saveOriginalFile(
    inputFile: string,
    providerName: string,
    filename: string
  ): Promise<string> {
    try {
      const periodMatch = filename.match(/_(\d{4})(\d{2})\d{2}_\d{4}__(\d{4})(\d{2})\d{2}_/);
      if (!periodMatch) {
        throw new Error('Cannot extract report period from filename');
      }
      
      // Get current month (1-12)
      const reportYear = periodMatch[1];
      const reportMonth = parseInt(periodMatch[2], 10).toString();
      
      // Sanitize provider name
      const safeName = providerName
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();
      
      // Create directory structure with year/month
      const dirPath = path.join(
        PROJECT_ROOT,
        'public',
        'parking-service',
        safeName,
        'report',
        reportYear,
        reportMonth, // Use month from report (1-12 without leading zero)
        'original'
      );
      
      await fs.mkdir(dirPath, { recursive: true });
      
      // Create unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileExt = path.extname(filename);
      const baseName = path.basename(filename, fileExt);
      const targetPath = path.join(dirPath, `${baseName}_${timestamp}${fileExt}`);
      
      // Copy the original file
      await fs.copyFile(inputFile, targetPath);
      
      this.log(`Original file saved to: ${targetPath}`, 'success');
      return targetPath;
      
    } catch (error) {
      const errorMsg = `Failed to save original file: ${error instanceof Error ? error.message : String(error)}`;
      this.log(errorMsg, 'error');
      throw new Error(errorMsg);
    }
  }

  // NEW: Move file to processed/error folder
  private async moveToProcessedFolder(
    inputFile: string, 
    filename: string, 
    type: 'processed' | 'error'
  ): Promise<void> {
    try {
      const targetDir = type === 'processed' ? PROCESSED_FOLDER : ERROR_FOLDER;
      await fs.mkdir(targetDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const targetPath = path.join(targetDir, `${timestamp}_${filename}`);
      
      await fs.rename(inputFile, targetPath);
      this.log(`File moved to ${type} folder: ${targetPath}`, 'info');
    } catch (moveError) {
      this.log(`Failed to move file to ${type} folder: ${moveError}`, 'error');
    }
  }

  // UPDATED: Save original file and move after processing
  async processFileWithImport(inputFile: string): Promise<{
  recordsProcessed: number;
  imported: number;
  updated: number;
  errors: number;
  duplicates: number;  // ← dodaj ovo
  warnings: string[];
  originalFilePath?: string;
}> {
    const filename = path.basename(inputFile);
    
    try {
      this.log(`Početak obrade: ${filename}`, 'info');
      this.updateFileStatus(filename, 'processing');
      
      // Extract provider name
      const providerName = this.excelProcessor.extractParkingProvider(filename);
      
      // Save original file first
      const originalFilePath = await this.saveOriginalFile(inputFile, providerName, filename);
      
      // Get or create parking service
      const { id: parkingServiceId, created } = await this.getOrCreateParkingService(providerName);
      
      if (created) {
        this.log(`Kreiran novi parking servis: ${providerName} (ID: ${parkingServiceId})`, 'success');
      } else {
        this.log(`Korišten postojeći parking servis: ${providerName} (ID: ${parkingServiceId})`, 'info');
      }

      // Process Excel file
      const result = await this.excelProcessor.processExcelFile(inputFile, parkingServiceId);
      this.log(`Pronađeno zapisa: ${result.records.length}`, 'info');
      
      // Map services
      const serviceNames = this.excelProcessor.getServiceNamesFromRecords(result.records);
      const serviceIdMapping = await this.createServiceMappings(serviceNames, parkingServiceId);
      
      // Assign service IDs
      this.excelProcessor.assignServiceIds(result.records, serviceIdMapping);
      
      // Import to database
      const importStats = await this.importRecordsToDatabase(result.records, filename);
      
      this.log(`Obrađeno zapisa: ${importStats.inserted + importStats.updated}`, 'success');
      this.log(`Pojedinačni rezultati: 
        - Novo: ${importStats.inserted}
        - Ažurirano: ${importStats.updated}
        - Greške: ${importStats.errors}
        - Duplikati: ${importStats.duplicates}`, 'info');
      
      // Move original file to processed folder
      await this.moveToProcessedFolder(inputFile, filename, 'processed');
      
      return {
        recordsProcessed: result.records.length,
        imported: importStats.inserted,
        updated: importStats.updated,
        errors: importStats.errors,
        duplicates: importStats.duplicates,
        warnings: result.warnings,
        originalFilePath
      };
      
    } catch (error) {
      this.log(`Kritična greška: ${error instanceof Error ? error.message : String(error)}`, 'error');
      
      // Move file to error folder
      await this.moveToProcessedFolder(inputFile, filename, 'error');
      
      return {
        recordsProcessed: 0,
        imported: 0,
        updated: 0,
        errors: 1,
        duplicates: 0,
        warnings: [`Kritična greška: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}