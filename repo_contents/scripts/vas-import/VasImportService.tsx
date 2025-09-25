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


  private normalizeProviderName(rawName: string): string {
  // Uklanjanje suvišnih razmaka i specijalnih karaktera
  const cleanedName = rawName
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .toUpperCase();

  // Mapa za normalizaciju naziva provajdera
  const providerMap: Record<string, string> = {
    'NTHMEDIA': 'NTH',
    'NTH MEDIA': 'NTH',
    'NTHMEDI': 'NTH',
    'NTH STANDARD': 'NTH',
    'NTH APPS': 'NTH',
    'NTH SAVETOVANJE': 'NTH',
    // Dodajte ostale varijacije po potrebi
  };

  // Provera da li je u mapi
  if (providerMap[cleanedName]) {
    return providerMap[cleanedName];
  }

  // Provera za NTH varijante
  if (cleanedName.includes('NTH')) {
    return 'NTH';
  }

  return cleanedName;
}


  extractProviderName(filename: string): string {
  // Uklonimo prefiks sa datumom ako postoji
  const cleanFilename = filename.replace(/^\d+_/, '');
  
  // Poboljšani regex
  const pattern = /Servis__SDP_([A-Za-z0-9\s]+)_[a-z]+_\d{8}\.xls$/i;
  const match = cleanFilename.match(pattern);
  
  if (match && match[1]) {
    const rawName = match[1].trim();
    return this.normalizeProviderName(rawName);
  }
  
  // Fallback za stare formate
  const baseName = path.basename(filename);
  const sdpPattern = /Servis_?_{1,3}SDP_?_{1,3}([A-Za-z0-9\s]+)_/i;
  const sdpMatch = baseName.match(sdpPattern);
  
  if (sdpMatch && sdpMatch[1]) {
    return this.normalizeProviderName(sdpMatch[1].trim());
  }

  const patterns = [
    /Servis__MicropaymentMerchantReport_([A-Za-z0-9\s]+)_Apps_\d+__\d+_\d+/i,
    /Servis__MicropaymentMerchantReport_([A-Za-z0-9\s]+)_Standard_\d+__\d+_\d+/i,
    /Servis__MicropaymentMerchantReport_([A-Za-z0-9\s]+)_Media_\d+__\d+_\d+/i
  ];
  
  for (const pattern of patterns) {
    const match = baseName.match(pattern);
    if (match && match[1]) {
      return this.normalizeProviderName(match[1].trim());
    }
  }
  
  const codeMatch = baseName.match(/[A-Za-z0-9]{3,5}/);
  return codeMatch ? this.normalizeProviderName(codeMatch[0]) : 'UNK';
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

  private mergeRecords(records: VasRecord[]): VasRecord[] {
  const mergedMap = new Map<string, VasRecord>();

  for (const record of records) {
    const key = `${record.date}_${record.serviceName}_${record.group}`;
    
    if (!mergedMap.has(key)) {
      // Prvi unos za ovaj datum
      mergedMap.set(key, { ...record });
      
      // Ako je količina 0 ali ima vrednost (retki slučajevi)
      if (record.quantity === 0 && record.amount !== 0) {
        mergedMap.get(key)!.quantity = record.amount > 0 ? 1 : -1;
      }
    } else {
      const existing = mergedMap.get(key)!;
      
      // Pravilo 1: Ako postoji +500 i dodajemo -500
      if (existing.price > 0 && record.price < 0) {
        existing.quantity = Math.max(0, existing.quantity - Math.abs(record.quantity));
        existing.amount += record.amount; // automatski smanjuje jer je record.amount negativan
        
        // Ako smo potrošili sve pozitivne količine, prebacujemo u negativ
        if (existing.quantity === 0 && existing.amount < 0) {
          existing.price = record.price; // postavi negativnu cenu
          existing.quantity = Math.abs(record.quantity);
        }
      }
      // Pravilo 2: Ako oba unosa su negativna
      else if (existing.price < 0 && record.price < 0) {
        existing.quantity += record.quantity;
        existing.amount += record.amount;
      }
      // Pravilo 3: Ako postoji -500 i dodajemo +500 (ne očekuje se)
      else if (existing.price < 0 && record.price > 0) {
        existing.quantity = Math.max(0, Math.abs(existing.quantity) - record.quantity);
        existing.amount += record.amount;
        
        // Ako smo potrošili sve negativne količine, prebacujemo u pozitiv
        if (existing.quantity === 0 && existing.amount > 0) {
          existing.price = record.price; // postavi pozitivnu cenu
          existing.quantity = record.quantity;
        }
      }
    }
  }

  // Post-procesiranje za konzistentnost
  for (const [_, record] of mergedMap) {
    // Osiguraj da negativne vrednosti imaju negativne količine
    if (record.amount < 0 && record.quantity > 0) {
      record.quantity = -record.quantity;
    }
    // Osiguraj da pozitivne vrednosti imaju pozitivne količine
    else if (record.amount > 0 && record.quantity < 0) {
      record.quantity = Math.abs(record.quantity);
    }
  }

  return Array.from(mergedMap.values());
}

  async importRecordsToDatabase(
  records: VasRecord[]
): Promise<{ logs: string[]; inserted: number; updated: number; errors: number }> {
  // Merge records before processing
  const mergedRecords = this.mergeRecords(records);
  
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  const logs: string[] = [`Starting import of ${mergedRecords.length} merged records...`];

  for (const [index, record] of mergedRecords.entries()) {
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
  }

  logs.push(
    `\nImport summary:`,
    `✅ ${inserted} records inserted`,
    `🔄 ${updated} records updated`,
    `❌ ${errors} records failed`,
    `Total processed: ${inserted + updated + errors}/${mergedRecords.length}`
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
  // Normalizujemo naziv pre traženja u bazi
  const normalizedName = this.normalizeProviderName(name);
  
  let provider = await prisma.provider.findFirst({
    where: { 
      name: {
        equals: normalizedName,
        mode: 'insensitive' // Case-insensitive search
      }
    }
  });

  if (!provider) {
    provider = await prisma.provider.create({
      data: {
        name: normalizedName,
        isActive: true
      }
    });
    
    await this.logActivity(
      'Provider',
      provider.id,
      'CREATE',
      `Created provider ${normalizedName}`
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

  private extractContractName(filename: string): string {
  // 1. Pronađi prvu grupu od 3+ slova nakon Servis/SDP
  const prefixMatch = filename.match(/(Servis|SDP)[^a-zA-Z]*([A-Z]{3,})/i);
  
  if (!prefixMatch || !prefixMatch[2]) {
    throw new Error(`Ne mogu pronaći prefix u nazivu fajla: ${filename}`);
  }

  const firstThree = prefixMatch[2].substring(0, 3).toUpperCase();
  const remaining = prefixMatch[2].substring(3);

  // 2. Pronađi sledeću ključnu reč nakon prefixa
  const suffixMatch = filename.match(new RegExp(`${prefixMatch[2]}[^a-zA-Z]*([A-Za-z]+)`));
  
  if (!suffixMatch || !suffixMatch[1]) {
    throw new Error(`Ne mogu pronaći suffix u nazivu fajla: ${filename}`);
  }

  const suffix = suffixMatch[1].toUpperCase();

  // 3. Formiraj naziv ugovora
  return `${firstThree}_${suffix}`;
}

private extractContractDetails(filename: string): { contractType: string; contractName: string } {
  // Uklonimo prefiks sa datumom ako postoji
  const cleanFilename = filename.replace(/^\d+_/, '');
  
  // Poboljšani regex koji toleriše razmake i dodatne donje crte
  const pattern = /Servis__SDP_([A-Za-z0-9\s]+)_([a-z]+)_\d{8}\.xls$/i;
  const match = cleanFilename.match(pattern);
  
  if (match && match[1] && match[2]) {
    const providerName = match[1].trim().replace(/\s+/g, ' '); // Normalizacija razmaka
    const contractType = match[2].trim().toUpperCase();
    
    return {
      contractType,
      contractName: `${providerName.replace(/\s/g, '_')}_${contractType}`
    };
  }
  
  // Fallback za ostale formate
  if (cleanFilename.includes('_Apps_')) return { contractType: 'APPS', contractName: 'APPS' };
  if (cleanFilename.includes('_Media_')) return { contractType: 'MEDIA', contractName: 'MEDIA' };
  if (cleanFilename.includes('_Standard_')) return { contractType: 'STANDARD', contractName: 'STANDARD' };
  if (cleanFilename.includes('_Commerce_')) return { contractType: 'COMMERCE', contractName: 'COMMERCE' };
  
  // Još jedan fallback pokušaj
  const parts = cleanFilename.split('_');
  if (parts.length >= 5) {
    const providerName = parts[2]?.trim();
    const contractType = parts[3]?.trim().toUpperCase();
    
    if (providerName && contractType) {
      return {
        contractType,
        contractName: `${providerName.replace(/\s/g, '_')}_${contractType}`
      };
    }
  }
  
  throw new Error(`Nepoznat format ugovora: ${filename}`);
}

private async getOrCreateContract(
  providerId: string,
  filename: string
): Promise<{ contract: Contract }> {
  const { contractType, contractName } = this.extractContractDetails(filename);
  
  // Proverimo da li ugovor već postoji za ovog provajdera
  const existingContract = await prisma.contract.findFirst({
    where: {
      providerId,
      name: contractName
    }
  });

  if (existingContract) return { contract: existingContract };

  // Kreiraj novi ugovor
  const newContract = await prisma.contract.create({
    data: {
      name: contractName,
      contractNumber: `VAS-${contractType}-${Date.now().toString().slice(-6)}`,
      type: 'PROVIDER',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      providerId,
      createdById: this.currentUserId,
      revenuePercentage: 0,
      description: `Automatski kreiran ugovor za ${contractName} servise`
    }
  });

  return { contract: newContract };
}

private async migrateExistingProviders() {
  try {
    // Pronađi sve provajdere koji sadrže "NTH" u nazivu
    const nthProviders = await prisma.provider.findMany({
      where: {
        name: {
          contains: 'NTH',
          mode: 'insensitive'
        }
      }
    });

    // Ažuriraj ih na normalizovani naziv "NTH"
    for (const provider of nthProviders) {
      if (provider.name.toUpperCase() !== 'NTH') {
        await prisma.provider.update({
          where: { id: provider.id },
          data: { name: 'NTH' }
        });
        console.log(`Migrated provider ${provider.name} to NTH`);
      }
    }
  } catch (error) {
    console.error('Error migrating providers:', error);
  }
}

// Pozovite u konstruktoru ili pre procesiranja

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
    
    const filename = path.basename(inputFile);
    const providerName = this.extractProviderName(filename);
    const provider = await this.getOrCreateProvider(providerName);
    
    // Detektuj tip ugovora iz naziva fajla
    const contractType = this.detectContractType(filename);
    const { contract } = await this.getOrCreateContract(provider.id, filename);

    const serviceNamesInFile = new Set<string>();
    const serviceIdMapping: { [key: string]: string } = {};
    const newServices: {name: string, code?: string, type: string}[] = [];

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
            
            if (quantity !== 0 && currentGroup === 'prepaid') {
              sheetRecords.push({
                providerId: provider.id,
                serviceId: '',
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

    // Create services and track new ones
    for (const serviceName of serviceNamesInFile) {
      const serviceCode = this.extractServiceCode(serviceName);
      const existingService = await prisma.service.findFirst({
        where: { name: serviceName }
      });

      if (!existingService) {
        newServices.push({
          name: serviceName,
          code: serviceCode,
          type: contractType
        });
      }

      const { service } = await this.getOrCreateService(
        serviceName,
        'VAS',
        'PREPAID',
        serviceCode
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

    // Prepare logs with new services info
    const logs: string[] = [
      `ℹ️ Using contract: ${contract.contractNumber} (${contractType})`,
      `ℹ️ Provider: ${providerName}`
    ];

    if (newServices.length > 0) {
      logs.push('\n⚠️ NEW SERVICES DETECTED:');
      newServices.forEach(service => {
        logs.push(`• ${service.name} (${service.code || 'no code'}) - ${service.type}`);
      });
    }

    return {
      records: allSheetsData,
      providerId: provider.id,
      providerName,
      filename,
      userId: this.currentUserId,
      importLogs: logs
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

private detectContractType(filename: string): string {
  // Uklonimo prefiks sa datumom ako postoji
  const cleanFilename = filename.replace(/^\d+_/, '');
  
  // Poboljšani regex koji toleriše razmake
  const pattern = /Servis__SDP_[A-Za-z0-9\s]+_([a-z]+)_\d{8}\.xls$/i;
  const match = cleanFilename.match(pattern);
  
  if (match && match[1]) {
    return match[1].trim().toUpperCase();
  }
  
  // Fallback za stare formate
  const lowerFilename = cleanFilename.toLowerCase();
  
  if (lowerFilename.includes('_apps_') || lowerFilename.includes('app')) return 'APPS';
  if (lowerFilename.includes('_standard_') || lowerFilename.includes('standard')) return 'STANDARD';
  if (lowerFilename.includes('_media_') || lowerFilename.includes('media')) return 'MEDIA';
  if (lowerFilename.includes('_commerce_') || lowerFilename.includes('commerce')) return 'COMMERCE';
  
  // Detekcija po delovima
  const parts = cleanFilename.split('_');
  for (const part of parts) {
    const lowerPart = part.toLowerCase();
    if (lowerPart === 'standard') return 'STANDARD';
    if (lowerPart === 'commerce') return 'COMMERCE';
    if (lowerPart === 'media') return 'MEDIA';
    if (lowerPart === 'apps') return 'APPS';
  }
  
  return 'GENERAL';
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