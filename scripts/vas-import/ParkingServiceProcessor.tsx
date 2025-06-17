////scripts/parking-import/ParkingServiceProcessor.tsx
import { PrismaClient, Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { v4 as uuidv4 } from 'uuid';
import { parse as parseCSV } from 'csv-parse';


const prisma = new PrismaClient();

// Environment configuration
const PROJECT_ROOT = process.cwd();
const FOLDER_PATH = path.join(PROJECT_ROOT, 'scripts', 'input');
const PROCESSED_FOLDER = path.join(PROJECT_ROOT, 'scripts', 'processed');
const ERROR_FOLDER = path.join(PROJECT_ROOT, 'scripts', 'errors');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'scripts', 'data', 'parking_output.csv');

interface ParkingRecord {
  parkingServiceId: string;
  serviceId?: string;
  date: string;
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

class ParkingServiceProcessor {
  private currentUserId: string;

  constructor(userId?: string) {
    this.currentUserId = userId || 'system-user';
  }

  async ensureDirectories(): Promise<void> {
    const dirs = [FOLDER_PATH, PROCESSED_FOLDER, ERROR_FOLDER, path.dirname(OUTPUT_FILE)];
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`Error creating directory ${dir}:`, error);
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
    const patterns = [
      /_mParking_([A-Za-z0-9]+)_\d+__\d+_/,
      /Servis__MicropaymentMerchantReport_([A-Za-z0-9]+)__\d+_/,
      /Parking_([A-Za-z0-9]+)_\d{8}/
    ];
    
    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match && match[1]) {
        let provider = match[1].replace(/_/g, ' ');
        provider = provider.replace(/\d{4,}/g, '').trim();
        return provider;
      }
    }
    
    return `Unknown_${path.basename(filename).slice(0, 10)}`;
  }

  convertToFloat(val: any): number {
    if (typeof val === 'string') {
      const cleaned = val.replace(/,/g, '').trim();
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return parseFloat(val) || 0;
  }

  convertDateFormat(dateStr: string): Date | null {
    if (!dateStr) return null;
    try {
      const cleaned = dateStr.toString().replace(/[^\d.]/g, '');
      if (cleaned.split('.').length === 3) {
        const parts = cleaned.split('.');
        let [day, month, year] = parts;
        if (year.length === 2) year = `20${year}`;
        const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        return isNaN(date.getTime()) ? null : date;
      }
      return null;
    } catch (error) {
      return null;
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
      console.error('Failed to create ActivityLog:', error);
    }
  }

  async getOrCreateParkingService(name: string): Promise<{ id: string; created: boolean }> {
    let parkingService = await prisma.parkingService.findFirst({
      where: { name }
    });

    if (parkingService) {
      return { id: parkingService.id, created: false };
    }

    parkingService = await prisma.parkingService.create({
      data: {
        name,
        isActive: true
      }
    });

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
    // First find or create a contract
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

    // Then create service contract relationship
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
      console.error('Error updating parking service file info:', error);
      throw error;
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
      console.error('Error moving file:', error);
      try {
        const errorFile = path.join(ERROR_FOLDER, path.basename(sourceFile));
        await fs.rename(sourceFile, errorFile);
        console.log(`File moved to error folder: ${errorFile}`);
      } catch (moveError) {
        console.error('Could not move file to error folder:', moveError);
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

  async processExcelFile(inputFile: string): Promise<FileProcessResult> {
    try {
      await this.logActivity(
        'System',
        'start',
        'PROCESS_START',
        `Started processing ${path.basename(inputFile)}`
      );

      const fileBuffer = await fs.readFile(inputFile);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const allSheetsData: ParkingRecord[] = [];
      
      const filename = path.basename(inputFile);
      const providerName = this.extractParkingProvider(filename);
      const { id: parkingServiceId, created: psCreated } = await this.getOrCreateParkingService(providerName);

      // Update file info
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

      // Process each sheet starting from sheet 3 (0-based index)
      for (let sheetIdx = 3; sheetIdx < sheetNames.length; sheetIdx++) {
        const sheetName = sheetNames[sheetIdx];
        const worksheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        if (!rows.length) continue;

        const header = rows[0].map((x: any) => String(x).trim());
        const dateCols = header[header.length - 1]?.toUpperCase() === 'TOTAL' 
          ? header.slice(3, -1) 
          : header.slice(3);

        let currentGroup = 'prepaid';
        const sheetRecords: ParkingRecord[] = [];
        
        let i = 1;
        while (i < rows.length) {
          const row = rows[i].map((x: any) => String(x).trim());
          
          if (!row.some(cell => cell)) {
            i++;
            continue;
          }

          if (row.length > 1 && row[1].toLowerCase().includes('total')) {
            i++;
            continue;
          }

          if (i === 1 && (row[0].toLowerCase().includes('servis') || row[0].toLowerCase().includes('izveštaj'))) {
            i++;
            continue;
          }

          const groupKeywords = ['prepaid', 'postpaid', 'total'];
          let foundGroup = false;
          
          for (const keyword of groupKeywords) {
            if (row[0].toLowerCase().includes(keyword)) {
              currentGroup = keyword;
              i++;
              foundGroup = true;
              break;
            }
          }

          if (!foundGroup && row[0]) {
            const serviceName = row[0].trim();
            serviceNamesInFile.add(serviceName);
            
            const price = this.convertToFloat(row[1]);
            const quantityValues = header[header.length - 1]?.toUpperCase() === 'TOTAL' 
              ? row.slice(3, -1) 
              : row.slice(3);

            let amountValues: any[] = [];
            if (i + 1 < rows.length) {
              const nextRow = rows[i + 1].map((x: any) => String(x).trim());
              amountValues = header[header.length - 1]?.toUpperCase() === 'TOTAL' 
                ? nextRow.slice(3, -1) 
                : nextRow.slice(3);
            }

            for (let j = 0; j < dateCols.length; j++) {
              const dateVal = dateCols[j];
              const quantity = this.convertToFloat(quantityValues[j] || 0);
              const amount = this.convertToFloat(amountValues[j] || 0);
              
              if (quantity !== 0 && currentGroup === 'prepaid') {
                sheetRecords.push({
                  parkingServiceId,
                  serviceId: '', // Will be filled later
                  group: currentGroup,
                  serviceName,
                  price,
                  date: dateVal?.toString().replace(/\s+/g, '').replace(/\.$/, '') || '',
                  quantity,
                  amount
                });
              }
            }
            i += 2;
          } else {
            i++;
          }
        }
        
        allSheetsData.push(...sheetRecords);
      }

      // Create services and map IDs
      for (const serviceName of serviceNamesInFile) {
        const serviceCode = this.extractServiceCode(serviceName);
        if (serviceCode) {
          const { id: serviceId, created: serviceCreated } = await this.getOrCreateService(serviceCode);
          serviceIdMapping[serviceName] = serviceId;

          if (serviceCreated) {
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
      }

      // Update records with service IDs
      for (const record of allSheetsData) {
        if (serviceIdMapping[record.serviceName]) {
          record.serviceId = serviceIdMapping[record.serviceName];
        } else {
          console.warn(`⚠️ No service ID found for: ${record.serviceName}`);
          await this.logActivity(
            'System',
            'warning',
            'MISSING_SERVICE',
            `No service ID for ${record.serviceName}`
          );
        }
      }

      return {
        records: allSheetsData,
        parkingServiceId,
        providerName,
        filename,
        userId: this.currentUserId
      };
      
    } catch (error) {
      await this.logActivity(
        'System',
        'error',
        'PROCESS_ERROR',
        `Error processing ${path.basename(inputFile)}`,
        error instanceof Error ? error.message : String(error),
        'ERROR'
      );
      throw error;
    }
  }

  async importRecordsToDatabase(records: ParkingRecord[]): Promise<{ inserted: number; updated: number; errors: number }> {
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const record of records) {
    try {
      const date = this.convertDateFormat(record.date);
      if (!date) {
        errors++;
        continue;
      }

      // Proverite da li već postoji isti unos
      const existing = await prisma.parkingTransaction.findFirst({
        where: {
          parkingServiceId: record.parkingServiceId,
          date: date,
          serviceName: record.serviceName,
          group: record.group
        }
      });

      if (existing) {
        // Ažuriranje postojećeg unosa
        await prisma.parkingTransaction.update({
          where: { id: existing.id },
          data: {
            price: record.price,
            quantity: record.quantity,
            amount: record.amount,
            serviceId: record.serviceId,
            updatedAt: new Date()
          }
        });
        updated++;
      } else {
        // Kreiranje novog unosa
        await prisma.parkingTransaction.create({
          data: {
            parkingServiceId: record.parkingServiceId,
            serviceId: record.serviceId,
            date: date,
            group: record.group,
            serviceName: record.serviceName,
            price: record.price,
            quantity: record.quantity,
            amount: record.amount,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        inserted++;
      }
    } catch (error) {
      errors++;
      console.error(`Error processing record:`, error);
      await this.logActivity(
        'ParkingTransaction',
        'error',
        'CREATE_ERROR',
        `Failed to process record`,
        error instanceof Error ? error.message : String(error),
        'ERROR'
      );
    }
  }

  return { inserted, updated, errors };
}

  async processAllFiles(): Promise<void> {
    try {
      this.currentUserId = await this.getOrCreateSystemUser();
      await this.ensureDirectories();
      
      const excelFiles = [
        ...(await glob(path.join(FOLDER_PATH, '*.xlsx'))),
        ...(await glob(path.join(FOLDER_PATH, '*.xls')))
      ];
      
      if (!excelFiles.length) {
        console.log('No Excel files found in input folder');
        return;
      }
      
      const allRecords: ParkingRecord[] = [];
      
      for (const filePath of excelFiles) {
        try {
          const result = await this.processExcelFile(filePath);
          
          if (result.records.length) {
            allRecords.push(...result.records);
            await this.moveFileToServiceDirectory(
              filePath,
              result.parkingServiceId,
              result.providerName,
              result.filename
            );
          } else {
            const errorFile = path.join(ERROR_FOLDER, path.basename(filePath));
            await fs.rename(filePath, errorFile);
          }
        } catch (error) {
          const errorFile = path.join(ERROR_FOLDER, path.basename(filePath));
          await fs.rename(filePath, errorFile);
          continue;
        }
      }
      
      if (allRecords.length) {
        const importResult = await this.importRecordsToDatabase(allRecords);
        console.log(`Import completed: ${importResult.inserted} inserted, ${importResult.updated} updated, ${importResult.errors} errors`);
      }
      
    } catch (error) {
      console.error('Main process error:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

if (require.main === module) {
  const userId = process.argv[2];
  const processor = new ParkingServiceProcessor(userId);
  processor.processAllFiles()
    .then(() => console.log('Parking service processing completed'))
    .catch(error => {
      console.error('Parking service processing failed:', error);
      process.exit(1);
    });
}

export { ParkingServiceProcessor };