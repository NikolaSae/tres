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
      existing.price = newPrice; // ✅ Update price
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
    // Implementation unchanged
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

  async cleanupOldFiles(daysOld: number = 30): Promise<{
    processedCleaned: number;
    errorsCleaned: number;
  }> {
    // Implementation unchanged
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
    // Implementation unchanged
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
    // Implementation unchanged
  }

  async getOrCreateSystemUser(): Promise<string> {
    // Implementation unchanged
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
        createdById: this.currentUserId // Fixed this line
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
    // Koristimo cijeli naziv usluge kao ključ
    const serviceCode = serviceName.trim();
    
    // Provjera cache-a
    if (this.serviceCache.has(serviceCode)) {
      serviceIdMapping[serviceName] = this.serviceCache.get(serviceCode)!;
      continue;
    }

    // Provjera u bazi
    let service = await prisma.service.findFirst({
      where: { name: serviceCode }
    });

    // Kreiranje ako ne postoji
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

    // Povezivanje sa parking servisom
    await this.getOrCreateServiceContract(service.id, parkingServiceId);
    
    // Ažuriranje mappinga i cachea
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

      // Use upsert and capture the operation result
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

      // Determine operation type by checking created/updated timestamps
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

  async processFileWithImport(inputFile: string): Promise<{
  recordsProcessed: number;
  imported: number;
  updated: number;
  errors: number;
  warnings: string[];
}> {
  const filename = path.basename(inputFile);
  
  try {
    this.log(`Početak obrade: ${filename}`, 'info');
    this.updateFileStatus(filename, 'processing');
    
    // Ekstrakcija i kreiranje parking servisa
    const providerName = this.excelProcessor.extractParkingProvider(filename);
    const { id: parkingServiceId, created } = await this.getOrCreateParkingService(providerName);
    
    if (created) {
      this.log(`Kreiran novi parking servis: ${providerName} (ID: ${parkingServiceId})`, 'success');
    } else {
      this.log(`Korišten postojeći parking servis: ${providerName} (ID: ${parkingServiceId})`, 'info');
    }

    // Obrada Excel fajla
    const result = await this.excelProcessor.processExcelFile(inputFile, parkingServiceId);
    this.log(`Pronađeno zapisa: ${result.records.length}`, 'info');
    
    // Mapiranje usluga
    const serviceNames = this.excelProcessor.getServiceNamesFromRecords(result.records);
    const serviceIdMapping = await this.createServiceMappings(serviceNames, parkingServiceId);
    
    // Dodjela ID-eva usluga
    this.excelProcessor.assignServiceIds(result.records, serviceIdMapping);
    
    // Snimanje u bazu
    const importStats = await this.importRecordsToDatabase(result.records, filename);
    
    this.log(`Obrađeno zapisa: ${importStats.inserted + importStats.updated}`, 'success');
    this.log(`Pojedinačni rezultati: 
      - Novo: ${importStats.inserted}
      - Ažurirano: ${importStats.updated}
      - Greške: ${importStats.errors}
      - Duplikati: ${importStats.duplicates}`, 'info');
    
    return {
      recordsProcessed: result.records.length,
      imported: importStats.inserted,
      updated: importStats.updated,
      errors: importStats.errors,
      warnings: result.warnings
    };
    
  } catch (error) {
    this.log(`Kritična greška: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return {
      recordsProcessed: 0,
      imported: 0,
      updated: 0,
      errors: 1,
      warnings: [`Kritična greška: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}

  async disconnect() {
    await prisma.$disconnect();
  }
}