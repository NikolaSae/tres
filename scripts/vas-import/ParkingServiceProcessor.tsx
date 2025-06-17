// Path: scripts/vas-import/ParkingServiceProcessor.tsx
import { PrismaClient, Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Environment configuration
const PROJECT_ROOT = process.cwd();
const FOLDER_PATH = path.join(PROJECT_ROOT, 'scripts', 'input');
const PROCESSED_FOLDER = path.join(PROJECT_ROOT, 'scripts', 'processed');
const ERROR_FOLDER = path.join(PROJECT_ROOT, 'scripts', 'errors');

interface ParkingRecord {
  parkingServiceId: string;
  serviceId: string;
  date: Date;
  group: string;
  serviceName: string;
  price: number;
  quantity: number;
  amount: number;
}

interface FileProcessResult {
  records: ParkingRecord[];
  parkingServiceId: string;
  providerName: string;
  filename: string;
  userId: string;
}

// Dodaj callback interface za progress reporting
interface ProgressCallback {
  onLog?: (message: string, type: 'info' | 'error' | 'success', file?: string) => void;
  onProgress?: (fileName: string, progress: number) => void;
  onFileStatus?: (fileName: string, status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error') => void;
}

class ParkingServiceProcessor {
  private currentUserId: string;
  private progressCallback?: ProgressCallback;

  constructor(userId?: string, progressCallback?: ProgressCallback) {
    this.currentUserId = userId || 'system-user';
    this.progressCallback = progressCallback;
  }
  private async safeLogActivity(
    // ... parameters ...
  ): Promise<void> {
    try {
      // ... existing logActivity implementation ...
    } catch (error) {
      this.log(`ActivityLog fallback: ${action} - ${subject}`, 'error');
    }
  }
  private log(message: string, type: 'info' | 'error' | 'success' = 'info', file?: string) {
    console.log(`${type.toUpperCase()}: ${message}`);
    if (this.progressCallback?.onLog) {
      this.progressCallback.onLog(message, type, file);
    }
  }

  private updateProgress(fileName: string, progress: number) {
    if (this.progressCallback?.onProgress) {
      this.progressCallback.onProgress(fileName, progress);
    }
  }

  private updateFileStatus(fileName: string, status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error') {
    if (this.progressCallback?.onFileStatus) {
      this.progressCallback.onFileStatus(fileName, status);
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

  extractServiceCode(serviceName: string): string | null {
    if (!serviceName) return null;
    const pattern = /(?<!\d)(\d{4})(?!\d)/;
    const match = serviceName.toString().match(pattern);
    return match ? match[1] : null;
  }

  extractParkingProvider(filename: string): string {
    this.log(`Extracting provider from filename: ${filename}`, 'info');
    
    const patterns = [
      { pattern: /SDP_mParking_([A-Za-zđĐčČćĆžŽšŠ]+)_/, name: 'SDP mParking city pattern' },
      { pattern: /SDP_mParking_([A-Za-zđĐčČćĆžŽšŠ]+)_[A-Za-z]/, name: 'SDP mParking city with company pattern' },
      { pattern: /_mParking_([A-Za-z0-9]+)_\d+__\d+_/, name: 'mParking pattern' },
      { pattern: /Servis__MicropaymentMerchantReport_([A-Za-z0-9]+)__\d+_/, name: 'Servis pattern' },
      { pattern: /Parking_([A-Za-z0-9]+)_\d{8}/, name: 'Parking pattern' },
      { pattern: /^([A-Za-z0-9]+)_mParking_/, name: 'Provider_mParking pattern' },
      { pattern: /^([A-Za-z0-9]+)_Parking_/, name: 'Provider_Parking pattern' },
      { pattern: /^([A-Za-z0-9]+)_Servis_/, name: 'Provider_Servis pattern' },
    ];
    
    for (const { pattern, name } of patterns) {
      const match = filename.match(pattern);
      if (match && match[1]) {
        let provider = match[1];
        
        provider = provider.replace(/_+/g, ' ').trim();
        provider = provider.replace(/\s+/g, ' ');
        provider = provider.replace(/\d{5,}$/g, '').trim();
        
        provider = provider.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        if (provider.length >= 2) {
          this.log(`Found provider '${provider}' using ${name}`, 'success');
          return provider;
        }
      }
    }
    
    const basename = path.basename(filename, path.extname(filename));
    const parts = basename.split(/[_\-\s]+/);
    
    if (parts.length > 0 && parts[0].length >= 2) {
      let provider = parts[0];
      provider = provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();
      this.log(`Using fallback provider '${provider}' from first part`, 'info');
      return provider;
    }
    
    const fallback = `Unknown_${basename.substring(0, 10)}`;
    this.log(`Using fallback provider '${fallback}'`, 'error');
    return fallback;
  }

  convertToFloat(val: any): number {
    if (typeof val === 'string') {
      const cleaned = val.replace(/,/g, '').trim();
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return parseFloat(val) || 0;
  }

  parseDateFromComponents(yearStr: string, monthStr: string, dayStr: string): Date | null {
    this.log(`Parsing date components: year=${yearStr}, month=${monthStr}, day=${dayStr}`, 'info');
    
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    
    // Detaljnija validacija
    if (isNaN(year) || year < 2000 || year > new Date().getFullYear() + 1) {
      this.log(`Invalid year: ${yearStr} (parsed: ${year})`, 'error');
      throw new Error(`Invalid year: ${yearStr}`);
    }
    
    if (isNaN(month) || month < 0 || month > 11) {
      this.log(`Invalid month: ${monthStr} (parsed: ${month + 1})`, 'error');
      throw new Error(`Invalid month: ${monthStr}`);
    }
    
    if (isNaN(day) || day < 1 || day > 31) {
      this.log(`Invalid day: ${dayStr} (parsed: ${day})`, 'error');
      throw new Error(`Invalid day: ${dayStr}`);
    }
    
    const date = new Date(year, month, day);
    
    if (isNaN(date.getTime())) {
      this.log(`Invalid date created: year=${year}, month=${month}, day=${day}`, 'error');
      throw new Error(`Invalid date: ${year}-${month + 1}-${day}`);
    }
    
    this.log(`Successfully parsed date: ${date.toISOString().split('T')[0]}`, 'success');
    return date;
  }

  async safeProcessFile(inputFile: string): Promise<FileProcessResult> {
    try {
      return await this.processExcelFile(inputFile);
    } catch (error) {
      const errorId = uuidv4().slice(0, 8);
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      this.log(`[${errorId}] Processing failed: ${errorMsg}`, 'error');
      await this.safeLogActivity(
        'System',
        errorId,
        'PROCESS_FAILED',
        `File processing error`,
        `File: ${path.basename(inputFile)}\nError: ${errorMsg}`,
        'ERROR'
      );

      // Move to error directory
      const errorPath = path.join(ERROR_FOLDER, `${Date.now()}_${path.basename(inputFile)}`);
      await fs.rename(inputFile, errorPath);
      
      throw new Error(`Processing failed (${errorId})`);
    }
  }

  async getParkingServiceSafe(id: string) {
    const service = await prisma.parkingService.findUnique({
      where: { id },
      include: { contracts: true, transactions: true }
    });

    if (!service) {
      await this.safeLogActivity(
        'System',
        id,
        'MISSING_SERVICE',
        `Parking service not found`,
        `ID: ${id}`,
        'ERROR'
      );
      throw new Error(`Parking service ${id} not found`);
    }

    return service;
  }
}

  extractYearFromFilename(filename: string): string {
    const yearMatch = filename.match(/(\d{4})/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      if (year >= 2000 && year <= new Date().getFullYear() + 1) {
        return year.toString();
      }
    }
    return new Date().getFullYear().toString();
  }

  extractMonthFromFilename(filename: string): string {
    const monthMatch = filename.match(/_(\d{4})(\d{2})(\d{2})_/);
    if (monthMatch && monthMatch[2]) {
      return monthMatch[2];
    }
    return (new Date().getMonth() + 1).toString().padStart(2, '0');
  }

  async getOrCreateSystemUser(): Promise<string> {
    let user = await prisma.user.findFirst({
      where: { email: 'system@internal.app' }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'System User',
          email: 'system@internal.app',
          role: 'ADMIN',
          isActive: true
        }
      });
    }

    return user.id;
  }

  async logActivity(
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

  async getOrCreateParkingService(name: string): Promise<{ id: string; created: boolean }> {
    this.log(`Looking for parking service: ${name}`, 'info');
    
    let parkingService = await prisma.parkingService.findFirst({
      where: { name }
    });

    if (parkingService) {
      this.log(`Found existing parking service: ${name} (ID: ${parkingService.id})`, 'success');
      return { id: parkingService.id, created: false };
    }

    parkingService = await prisma.parkingService.create({
      data: {
        name,
        isActive: true
      }
    });

    this.log(`Created new parking service: ${name} (ID: ${parkingService.id})`, 'success');

    await this.logActivity(
      'ParkingService',
      parkingService.id,
      'CREATE',
      `Created parking service ${name}`
    );

    return { id: parkingService.id, created: true };
  }

  async getOrCreateService(serviceCode: string): Promise<{ id: string; created: boolean }> {
    let service = await prisma.service.findFirst({
      where: { name: serviceCode }
    });

    if (service) {
      return { id: service.id, created: false };
    }

    service = await prisma.service.create({
      data: {
        name: serviceCode,
        type: 'PARKING',
        billingType: 'PREPAID',
        description: `Auto-created parking service: ${serviceCode}`,
        isActive: true
      }
    });

    await this.logActivity(
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
          parkingServiceId,
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

    await this.logActivity(
      'ServiceContract',
      serviceContract.id,
      'CREATE',
      'Created service contract connection'
    );

    return { id: serviceContract.id, created: true };
  }

  async updateParkingServiceFileInfo(
    parkingServiceId: string,
    filename: string,
    filePath: string,
    fileSize: number,
    importStatus: string
  ): Promise<void> {
    try {
      const mimeType = filename.endsWith('.xlsx') 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/vnd.ms-excel';

      await prisma.parkingService.update({
        where: { id: parkingServiceId },
        data: {
          originalFileName: filename,
          originalFilePath: filePath,
          fileSize,
          mimeType,
          lastImportDate: new Date(),
          importedBy: this.currentUserId,
          importStatus,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      this.log(`Error updating parking service file info: ${error}`, 'error');
    }
  }

  async createParkingServiceDirectory(providerName: string, year: string): Promise<string> {
    const safeProviderName = providerName.replace(/[^\w\s-]/g, '').replace(/[-\s]+/g, '-');
    const basePath = path.join(PROJECT_ROOT, 'public', 'parking-servis', safeProviderName, 'reports', year);
    await fs.mkdir(basePath, { recursive: true });
    return basePath;
  }

  async moveFileToServiceDirectory(
    sourceFile: string,
    parkingServiceId: string,
    providerName: string,
    filename: string
  ): Promise<string | null> {
    try {
      const year = this.extractYearFromFilename(filename);
      const targetDir = await this.createParkingServiceDirectory(providerName, year);
      const targetFile = path.join(targetDir, filename);
      
      await fs.rename(sourceFile, targetFile);
      
      await this.updateParkingServiceFileInfo(
        parkingServiceId,
        filename,
        targetFile,
        (await fs.stat(targetFile)).size,
        'completed'
      );
      
      await this.logActivity(
        'ParkingService',
        parkingServiceId,
        'FILE_MOVED',
        `File moved to ${targetFile}`
      );
      
      return targetFile;
    } catch (error) {
      this.log(`Error moving file: ${error}`, 'error');
      try {
        const errorFile = path.join(ERROR_FOLDER, path.basename(sourceFile));
        await fs.rename(sourceFile, errorFile);
        this.log(`File moved to error folder: ${errorFile}`, 'info');
      } catch (moveError) {
        this.log(`Could not move file to error folder: ${moveError}`, 'error');
      }
      
      await this.logActivity(
        'ParkingService',
        parkingServiceId,
        'FILE_MOVE_ERROR',
        `Failed to move file ${path.basename(sourceFile)}`,
        error instanceof Error ? error.message : String(error),
        'ERROR'
      );
      
      return null;
    }
  }

  async getOrCreateDefaultService(): Promise<string> {
    const DEFAULT_SERVICE_CODE = "9999";
    const { id } = await this.getOrCreateService(DEFAULT_SERVICE_CODE);
    return id;
  }

  async processExcelFile(inputFile: string): Promise<FileProcessResult> {
    const filename = path.basename(inputFile);
    try {
      this.log(`Processing file: ${filename}`, 'info', filename);
      this.updateFileStatus(filename, 'processing');
      this.updateProgress(filename, 10);
      
      await this.logActivity(
        'System',
        'start',
        'PROCESS_START',
        `Started processing ${filename}`
      );

      const fileBuffer = await fs.readFile(inputFile);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const allSheetsData: ParkingRecord[] = [];
      
      const providerName = this.extractParkingProvider(filename);
      const { id: parkingServiceId, created: psCreated } = await this.getOrCreateParkingService(providerName);

      this.updateProgress(filename, 30);

      const fileStats = await fs.stat(inputFile);
      await this.updateParkingServiceFileInfo(
        parkingServiceId,
        filename,
        inputFile,
        fileStats.size,
        'in_progress'
      );

      if (psCreated) {
        await this.logActivity(
          'ParkingService',
          parkingServiceId,
          'CREATE',
          `Created parking service for ${providerName}`
        );
      }

      const sheetNames = workbook.SheetNames;
      const serviceNamesInFile = new Set<string>();
      const serviceIdMapping: { [key: string]: string } = {};

      // Extract year and month from filename
      const year = this.extractYearFromFilename(filename);
      const month = this.extractMonthFromFilename(filename);

      this.log(`Processing ${sheetNames.length} sheets for year: ${year}, month: ${month}`, 'info', filename);
      this.updateProgress(filename, 50);

      // KRITIČNA ISPRAVKA: Počni od sheet-a 0, ne 3
      for (let sheetIdx = 0; sheetIdx < sheetNames.length; sheetIdx++) {
        const sheetName = sheetNames[sheetIdx];
        this.log(`Processing sheet: ${sheetName} (${sheetIdx + 1}/${sheetNames.length})`, 'info', filename);
        
        const worksheet = workbook.Sheets[sheetName];
        
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: null,
          blankrows: false,
          skipHidden: true
        }).filter(row => row.some(cell => cell !== null));
        
        if (!rows.length) {
          this.log(`Sheet ${sheetName} is empty, skipping`, 'info', filename);
          continue;
        }

        this.log(`Sheet ${sheetName} has ${rows.length} rows`, 'info', filename);

        const header = rows[0].map((x: any) => String(x).trim());
        
        // POBOLJŠANJE: Bolje prepoznavanje date kolona
        let dateCols: string[] = [];
        let dataStartCol = 3; // default
        
        // Pokušaj da pronađeš kolone sa brojevima (datumi)
        for (let i = 0; i < header.length; i++) {
          const colValue = header[i];
          if (colValue && /^\d+\.?$/.test(colValue.toString().trim())) {
            if (dateCols.length === 0) {
              dataStartCol = i; // Prvi datum označava početak data kolona
            }
            dateCols.push(colValue.toString().replace('.', ''));
          }
        }
        
        // Ako nema prepoznatih datum kolona, koristi original logiku
        if (dateCols.length === 0) {
          dateCols = header[header.length - 1]?.toUpperCase() === 'TOTAL' 
            ? header.slice(3, -1) 
            : header.slice(3);
          dataStartCol = 3;
        }

        this.log(`Found ${dateCols.length} date columns starting from column ${dataStartCol}`, 'info', filename);

        let currentGroup = 'prepaid';
        const sheetRecords: ParkingRecord[] = [];
        
        let i = 1;
        while (i < rows.length) {
          const row = rows[i].map((x: any) => x !== null ? String(x).trim() : '');
          
          if (!row.some(cell => cell)) {
            i++;
            continue;
          }

          // Skip total rows
          if (row.length > 1 && row[1].toLowerCase().includes('total')) {
            i++;
            continue;
          }

          // Skip header rows
          if (i === 1 && (row[0].toLowerCase().includes('servis') || row[0].toLowerCase().includes('izveštaj'))) {
            i++;
            continue;
          }

          // Detect group changes
          const groupKeywords = ['prepaid', 'postpaid', 'total'];
          let foundGroup = false;
          
          for (const keyword of groupKeywords) {
            if (row[0].toLowerCase().includes(keyword)) {
              currentGroup = keyword;
              this.log(`Found group marker: ${keyword}`, 'info', filename);
              i++;
              foundGroup = true;
              break;
            }
          }

          // Process data rows
          if (!foundGroup && row[0]) {
            const serviceName = row[0].trim();
            
            // KRITIČNA ISPRAVKA: Proveri da li je ovo stvarno service name
            if (!serviceName || serviceName.toLowerCase().includes('total') || serviceName.toLowerCase().includes('ukupno')) {
              i++;
              continue;
            }
            
            serviceNamesInFile.add(serviceName);
            
            const price = this.convertToFloat(row[1]);
            
            // POBOLJŠANJE: Koristi dataStartCol umesto hardkodovane 3
            const quantityValues = row.slice(dataStartCol, dataStartCol + dateCols.length);

            let amountValues: any[] = [];
            if (i + 1 < rows.length) {
              const nextRow = rows[i + 1].map((x: any) => x !== null ? String(x).trim() : '');
              amountValues = nextRow.slice(dataStartCol, dataStartCol + dateCols.length);
            }

            let recordsCreatedForService = 0;
            
            for (let j = 0; j < dateCols.length; j++) {
              const day = dateCols[j].toString().replace(/\s+/g, '').replace(/\.$/, '');
              const quantity = this.convertToFloat(quantityValues[j] || 0);
              const amount = this.convertToFloat(amountValues[j] || 0);
              
              // KRITIČNA ISPRAVKA: Kreiraj zapise i za quantity = 0 ako ima amount
              if ((quantity > 0 || amount > 0) && currentGroup === 'prepaid') {
                try {
                  const date = this.parseDateFromComponents(year, month, day);
                  
                  if (date) {
                    sheetRecords.push({
                      parkingServiceId,
                      serviceId: '', // Biće popunjeno kasnije
                      group: currentGroup,
                      serviceName,
                      price,
                      date,
                      quantity,
                      amount
                    });
                    recordsCreatedForService++;
                  }
                } catch (dateError) {
                  this.log(`Skipping record with invalid date: year=${year}, month=${month}, day=${day} - ${dateError}`, 'error', filename);
                }
              }
            }
            
            if (recordsCreatedForService > 0) {
              this.log(`Created ${recordsCreatedForService} records for service: ${serviceName}`, 'info', filename);
            }
            
            i += 2; // Skip next row (amounts)
          } else {
            i++;
          }
        }
        
        this.log(`Sheet ${sheetName} produced ${sheetRecords.length} records`, 'info', filename);
        allSheetsData.push(...sheetRecords);
      }

      this.updateProgress(filename, 70);

      // Create services and map them
      this.log(`Creating services for ${serviceNamesInFile.size} unique service names`, 'info', filename);
      
      for (const serviceName of serviceNamesInFile) {
        const serviceCode = this.extractServiceCode(serviceName) || serviceName.slice(-4).padStart(4, '0');
        const { id: serviceId, created: serviceCreated } = await this.getOrCreateService(serviceCode);
        serviceIdMapping[serviceName] = serviceId;

        if (serviceCreated) {
          this.log(`Created new service: ${serviceCode}`, 'success', filename);
          await this.logActivity(
            'Service',
            serviceId,
            'CREATE',
            `Created service ${serviceCode}`
          );
        }

        const { id: serviceContractId, created: contractCreated } = await this.getOrCreateServiceContract(
          serviceId,
          parkingServiceId
        );

        if (contractCreated) {
          await this.logActivity(
            'ServiceContract',
            serviceContractId,
            'CREATE',
            `Created service contract for ${serviceCode}`
          );
        }
      }

      // Assign service IDs to records
      let recordsWithoutServiceId = 0;
      for (const record of allSheetsData) {
        if (serviceIdMapping[record.serviceName]) {
          record.serviceId = serviceIdMapping[record.serviceName];
        } else {
          recordsWithoutServiceId++;
          record.serviceId = await this.getOrCreateDefaultService();
          await this.logActivity(
            'System',
            'warning',
            'MISSING_SERVICE',
            `Used default service for ${record.serviceName}`
          );
        }
      }

      if (recordsWithoutServiceId > 0) {
        this.log(`${recordsWithoutServiceId} records assigned to default service`, 'info', filename);
      }

      this.updateProgress(filename, 90);
      
      this.log(`Successfully processed ${allSheetsData.length} records for provider: ${providerName}`, 'success', filename);

      return {
        records: allSheetsData,
        parkingServiceId,
        providerName,
        filename,
        userId: this.currentUserId
      };
      
    } catch (error) {
      this.log(`Error processing file: ${error}`, 'error', filename);
      this.updateFileStatus(filename, 'error');
      await this.logActivity(
        'System',
        'error',
        'PROCESS_ERROR',
        `Error processing ${filename}`,
        error instanceof Error ? error.message : String(error),
        'ERROR'
      );
      throw error;
    }
  }

  async importRecordsToDatabase(
    records: ParkingRecord[],
    filename?: string
  ): Promise<{ inserted: number; updated: number; errors: number }> {
    const batchSize = 100;
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchTransactions: Prisma.PrismaPromise<any>[] = [];

      for (const record of batch) {
        const where = {
          parkingServiceId_date_serviceName_group: {
            parkingServiceId: record.parkingServiceId,
            date: record.date,
            serviceName: record.serviceName,
            group: record.group
          }
        };

        const data = {
          price: record.price,
          quantity: record.quantity,
          amount: record.amount,
          serviceId: record.serviceId,
          updatedAt: new Date()
        };

        batchTransactions.push(
          prisma.parkingTransaction.upsert({
            where,
            create: {
              ...where.parkingServiceId_date_serviceName_group,
              ...data,
              createdById: this.currentUserId
            },
            update: data
          })
        );
      }

      try {
        const results = await prisma.$transaction(batchTransactions);
        inserted += results.filter(r => r.createdAt).length;
        updated += results.filter(r => r.updatedAt > r.createdAt).length;
      } catch (error) {
        errors += batch.length;
        this.log(`Batch ${i / batchSize + 1} failed: ${error}`, 'error', filename);
      }
    }

    return { inserted, updated, errors };
  }

  async processFileWithImport(inputFile: string): Promise<{
    recordsProcessed: number;
    imported: number;
    updated: number;
    errors: number;
  }> {
    const filename = path.basename(inputFile);
    try {
      this.updateFileStatus(filename, 'processing');
      const result = await this.processExcelFile(inputFile);
      
      // Move file after processing
      await this.moveFileToServiceDirectory(
        inputFile,
        result.parkingServiceId,
        result.providerName,
        result.filename
      );

      // Calculate actual import results
      const importStats = await this.importRecordsToDatabase(result.records, filename);
      this.updateProgress(filename, 100);
      this.updateFileStatus(filename, 'completed');

      return {
        recordsProcessed: result.records.length,
        imported: importStats.inserted,
        updated: importStats.updated,
        errors: importStats.errors
      };
    } catch (error) {
      this.updateFileStatus(filename, 'error');
      throw error;
    }
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}