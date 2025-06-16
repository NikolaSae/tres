//scripts/vas-import/VasImportService.tsx
import { PrismaClient, ServiceType, BillingType, ContractType, ContractStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { parse as parseCSV } from 'csv-parse';

const prisma = new PrismaClient();

const PROJECT_ROOT = process.cwd();
const FOLDER_PATH = path.join(PROJECT_ROOT, 'scripts', 'input');
const PROCESSED_FOLDER = path.join(PROJECT_ROOT, 'scripts', 'processed');
const ERROR_FOLDER = path.join(PROJECT_ROOT, 'scripts', 'errors');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'scripts', 'data', 'vas_output.csv');

interface VasRecord {
  providerId: string;
  serviceId: string;
  group: string;
  serviceName: string;
  serviceCode: string;
  price: number;
  date: string;
  quantity: number;
  amount: number;
}

interface FileProcessResult {
  records: VasRecord[];
  providerId: string;
  providerName: string;
  filename: string;
  userId: string;
}

class VasImportService {
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

  extractProviderName(filename: string): string {
  // Remove timestamp prefix if present (e.g., "1750069812361_")
  const baseName = path.basename(filename).replace(/^\d+_/, '');
  
  const patterns = [
    /Servis__MicropaymentMerchantReport_([A-Z]+)_Apps_\d+__\d+_\d+/,
    /_mParking_([A-Za-z0-9]+)_\d+__\d+_/,
    /Parking_([A-Za-z0-9]+)_\d{8}/,
    /Servis__MicropaymentMerchantReport_([A-Z]+)_Standard_\d+__\d+_\d+/,
    /Servis__MicropaymentMerchantReport_([A-Z]+)_Media_\d+__\d+_\d+/
  ];
  
  for (const pattern of patterns) {
    const match = baseName.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Try to extract any 3-5 uppercase letter code from filename
  const codeMatch = baseName.match(/[A-Z]{3,5}/);
  if (codeMatch) {
    return codeMatch[0];
  }
  
  // Fallback: use first 10 characters of filename without timestamp
  return `Unknown_${baseName.slice(0, 10).replace(/\W/g, '')}`;
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

  async importRecordsToDatabase(
  records: VasRecord[]
): Promise<{ logs: string[]; inserted: number; updated: number; errors: number }> {
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  const logs: string[] = [`Starting import of ${records.length} records...`];

  for (const [index, record] of records.entries()) {
    try {
      const dateObj = this.convertDateFormat(record.date);
      if (!dateObj) {
        errors++;
        logs.push(`❌ Record ${index+1}: Invalid date format - ${record.date}`);
        continue;
      }

      const existing = await prisma.vasTransaction.findUnique({
        where: {
          providerId_date_serviceName_group: {
            providerId: record.providerId,
            date: dateObj,
            serviceName: record.serviceName,
            group: record.group
          }
        }
      });

      if (existing) {
        await prisma.vasTransaction.update({
          where: { id: existing.id },
          data: {
            price: record.price,
            quantity: record.quantity,
            amount: record.amount,
            serviceCode: record.serviceCode
          }
        });
        updated++;
        logs.push(`🔄 Record ${index+1}: Updated existing record for ${record.serviceName} on ${record.date}`);
      } else {
        await prisma.vasTransaction.create({
          data: {
            providerId: record.providerId,
            serviceId: record.serviceId,
            date: dateObj,
            group: record.group,
            serviceName: record.serviceName,
            serviceCode: record.serviceCode,
            price: record.price,
            quantity: record.quantity,
            amount: record.amount
          }
        });
        inserted++;
        logs.push(`✅ Record ${index+1}: Created new record for ${record.serviceName} on ${record.date}`);
      }
    } catch (error: any) {
      errors++;
      logs.push(`❌ Record ${index+1}: Failed to process ${record.serviceName} - ${error.message || 'Unknown error'}`);
    }

    // Log progress every 10 records
    if ((index + 1) % 10 === 0) {
      logs.push(`📊 Processed ${index+1}/${records.length} records...`);
    }
  }

  logs.push(
    `\nImport summary:`,
    `✅ ${inserted} records inserted`,
    `🔄 ${updated} records updated`,
    `❌ ${errors} records failed`,
    `Total processed: ${inserted + updated + errors}/${records.length}`
  );

  return { logs, inserted, updated, errors };
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

  async getOrCreateProvider(name: string) {
    let provider = await prisma.provider.findFirst({
      where: { name }
    });

    if (!provider) {
      provider = await prisma.provider.create({
        data: {
          name,
          isActive: true
        }
      });
      
      await this.logActivity(
        'Provider',
        provider.id,
        'CREATE',
        `Created provider ${name}`
      );
    }

    return provider;
  }

  async getOrCreateService(serviceCode: string, serviceType: ServiceType = 'VAS', billingType: BillingType = 'PREPAID') {
    let service = await prisma.service.findFirst({
      where: { name: serviceCode }
    });

    if (!service) {
      service = await prisma.service.create({
        data: {
          name: serviceCode,
          type: serviceType,
          billingType,
          description: `Auto-created VAS service: ${serviceCode}`,
          isActive: true
        }
      });
      
      await this.logActivity(
        'Service',
        service.id,
        'CREATE',
        `Created service ${serviceCode}`
      );
    }

    return { service };
  }

  async getOrCreateContract(providerId: string, contractType: ContractType = 'PROVIDER') {
    let contract = await prisma.contract.findFirst({
      where: { 
        providerId,
        type: contractType,
        status: 'ACTIVE'
      }
    });

    if (!contract) {
      const contractNumber = `AUTO-VAS-${providerId.slice(0, 8)}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
      
      contract = await prisma.contract.create({
        data: {
          name: 'Auto-generated VAS contract',
          contractNumber,
          type: contractType,
          status: 'ACTIVE' as ContractStatus,
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          revenuePercentage: 10.0,
          providerId,
          createdById: this.currentUserId
        }
      });
    }

    return { contract };
  }

  async getOrCreateServiceContract(serviceId: string, contractId: string) {
    let serviceContract = await prisma.serviceContract.findFirst({
      where: { 
        serviceId,
        contractId
      }
    });

    if (!serviceContract) {
      serviceContract = await prisma.serviceContract.create({
        data: {
          serviceId,
          contractId
        }
      });
      
      await this.logActivity(
        'ServiceContract',
        serviceContract.id,
        'CREATE',
        'Created service contract connection'
      );
    }

    return { serviceContract };
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
    const allSheetsData: VasRecord[] = [];
    
    const providerName = this.extractProviderName(path.basename(inputFile));
    const provider = await this.getOrCreateProvider(providerName);
    const { contract } = await this.getOrCreateContract(provider.id, 'PROVIDER');

    const serviceNamesInFile = new Set<string>();
    const serviceIdMapping: { [key: string]: string } = {};

    const sheetNames = workbook.SheetNames;

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
      const sheetRecords: VasRecord[] = [];
      
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
            
            // Handle all non-zero quantities including negative (storno)
            if (quantity !== 0 && currentGroup === 'prepaid') {
              sheetRecords.push({
                providerId: provider.id,
                serviceId: '', // Will be filled later
                group: currentGroup,
                serviceName,
                serviceCode: this.extractServiceCode(serviceName) || '',
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

    // Create services using service names
    for (const serviceName of serviceNamesInFile) {
      const serviceCode = this.extractServiceCode(serviceName);
      const { service } = await this.getOrCreateService(
        serviceName, // Use full name as identifier
        'VAS',
        'PREPAID',
        serviceCode // Optional extracted code
      );
      
      serviceIdMapping[serviceName] = service.id;
      await this.getOrCreateServiceContract(service.id, contract.id);
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
      providerId: provider.id,
      providerName,
      filename: path.basename(inputFile),
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

  private sanitizeTransactionRecord(row: any): VasRecord | null {
    try {
      return {
        providerId: row.providerId || '',
        serviceId: row.serviceId || '',
        group: row.group || '',
        serviceName: row.serviceName || '',
        serviceCode: row.serviceCode || '',
        price: this.convertToFloat(row.price) || 0,
        date: row.date || '',
        quantity: this.convertToFloat(row.quantity) || 0,
        amount: this.convertToFloat(row.amount) || 0
      };
    } catch (error) {
      return null;
    }
  }

  async createProviderDirectory(providerName: string, year: string): Promise<string> {
    const safeProviderName = providerName.replace(/[^\w\s-]/g, '').replace(/[-\s]+/g, '-');
    const basePath = path.join(PROJECT_ROOT, 'public', 'providers', safeProviderName, 'reports', year);
    await fs.mkdir(basePath, { recursive: true });
    return basePath;
  }

  async moveFileToProviderDirectory(
    sourceFile: string,
    providerId: string,
    providerName: string,
    filename: string
  ): Promise<string | null> {
    try {
      const year = this.extractYearFromFilename(filename);
      const targetDir = await this.createProviderDirectory(providerName, year);
      const targetFile = path.join(targetDir, filename);
      
      await fs.rename(sourceFile, targetFile);
      
      await this.logActivity(
        'Provider',
        providerId,
        'FILE_MOVED',
        `File moved to ${targetFile}`
      );
      
      return targetFile;
      
    } catch (error) {
      try {
        const errorFile = path.join(ERROR_FOLDER, path.basename(sourceFile));
        await fs.rename(sourceFile, errorFile);
      } catch (moveError) {
        console.error('Could not move file to error folder:', moveError);
      }
      
      await this.logActivity(
        'Provider',
        providerId,
        'FILE_MOVE_ERROR',
        `Failed to move file ${path.basename(sourceFile)}`,
        error instanceof Error ? error.message : String(error),
        'ERROR'
      );
      
      return null;
    }
  }

  async processAllFiles(): Promise<void> {
    try {
      this.currentUserId = await this.getOrCreateSystemUser();
      await this.ensureDirectories();
      
      const excelFiles = [
        ...(await glob(path.join(FOLDER_PATH, '*.xlsx'))),
        ...(await glob(path.join(FOLDER_PATH, '*.xls')))
      ];
      
      if (!excelFiles.length) return;
      
      const allRecords: VasRecord[] = [];
      
      for (const filePath of excelFiles) {
        try {
          const result = await this.processExcelFile(filePath);
          
          if (result.records.length) {
            allRecords.push(...result.records);
            await this.moveFileToProviderDirectory(
              filePath,
              result.providerId,
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
  const vasImporter = new VasImportService(userId);
  vasImporter.processAllFiles()
    .then(() => console.log('VAS import completed'))
    .catch(error => {
      console.error('VAS import failed:', error);
      process.exit(1);
    });
}

export { VasImportService };