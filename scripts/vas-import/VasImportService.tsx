// scripts/vas-import/VasImportService.tsx - COMPLETE PARSER FOR ALL FORMATS

import { PrismaClient, ServiceType, BillingType } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const prisma = new PrismaClient();
const PROJECT_ROOT = process.cwd();
const FOLDER_PATH = path.join(PROJECT_ROOT, 'scripts', 'input');
const PROCESSED_FOLDER = path.join(PROJECT_ROOT, 'scripts', 'processed');
const ERROR_FOLDER = path.join(PROJECT_ROOT, 'scripts', 'errors');

// ========================================
// ✅ INTERFEJSI
// ========================================

interface ProviderInfo {
  id: string;
  name: string;           // Standardizovani naziv u bazi
  displayName: string;    // Originalni naziv iz fajla
  folderName: string;     // Sigurni naziv za folder sistem
}

interface ContractInfo {
  contractType: string;   // "STANDARD", "MEDIA", "APPS", "SAVETOVANJE"
  contractNumber: string; // Merchant ID ili autogen broj
  revenueShare: number;   // 50, 60, 70
  contractName: string;   // "{PROVIDER}_{TYPE}"
}

interface FileParseResult {
  provider: ProviderInfo;
  contract: ContractInfo;
  year: string;
  month: string | null;
  format: 'SDP' | 'MICROPAYMENT';
}

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
  importLogs?: string[];
}

class VasImportService {
  private currentUserId: string;
  private providerCache = new Map<string, ProviderInfo>();

  constructor(userId?: string) {
    this.currentUserId = userId || 'system-user';
  }

  // ========================================
  // ✅ PROVIDER NORMALIZATION MAP
  // ========================================
  
  private readonly PROVIDER_NORMALIZATION: Record<string, string> = {
    // NTH variants
    'NTHMEDIA': 'NTH',
    'NTH MEDIA': 'NTH',
    'NTHDCB': 'NTH',
    'NTH DCB': 'NTH',
    'NTH': 'NTH',
    
    // ComTrade variants
    'COMTRADEITSS': 'ComTradeITSS',
    'COMTRADE ITSS': 'ComTradeITSS',
    'COMTRADE': 'ComTradeITSS',
    
    // OneClick variants
    'ONECLICKSOLUTIONS': 'OneClickSolutions',
    'ONE CLICK SOLUTIONS': 'OneClickSolutions',
    'ONECLICK': 'OneClickSolutions',
    
    // JP Posta variants
    'CEPP': 'JP Posta',
    'JP POSTA': 'JP Posta',
    'POSTA': 'JP Posta',
    
    // Akton variants
    'AKTON': 'Akton',
    
    // Mond variants
    'MOND': 'Mond',
    
    // Nuewoo variants
    'NPAY': 'Nuewoo',
    'NUEWOO': 'Nuewoo',
    
    // Processcom variants
    'EKG': 'Processcom',
    'PROCESSCOM': 'Processcom',
  };

  // ========================================
  // ✅ REVENUE SHARE MAP (PROVIDER + CONTRACT TYPE)
  // ========================================
  
  private readonly REVENUE_SHARE_MAP: Record<string, Record<string, number>> = {
    'NTH': {
      'MEDIA': 50,
      'SAVETOVANJE': 60,
      'STANDARD': 60,
      'DCB_APPS': 70,
      'DCB_MEDIA': 60,
      'DCB_STANDARD': 50
    },
    'ComTradeITSS': {
      'STANDARD': 50,
      'MEDIA': 60
    },
    'Mond': {
      'STANDARD': 50,
      'MEDIA': 60
    },
    'OneClickSolutions': {
      'STANDARD': 50,
      'MEDIA': 60
    },
    'JP Posta': {
      'STANDARD': 50,
      'MEDIA': 60
    },
    'Akton': {
      'STANDARD': 50,
      'MEDIA': 60
    },
    'Nuewoo': {
      'APPS': 70
    },
    'Processcom': {
      'GENERAL': 50
    }
  };

  // ========================================
  // ✅ FILE PARSER - DETECTS FORMAT AND EXTRACTS INFO
  // ========================================
  
  parseFilename(filename: string): FileParseResult {
    const cleanFilename = filename.replace(/^\d+_/, '');
    
    // FORMAT 1: Servis__SDP_PROVIDER_TYPE_YYYYMMDD.xls
    // Dozvoljava:
    // - Jedan ili više underscore-a između delova
    // - Space-ove u nazivima
    // - Kombinacije slova i brojeva
    const sdpPattern = /Servis__SDP_([A-Za-z0-9\s]+?)_+([a-z]+)_(\d{8})\.xls$/i;
    const sdpMatch = cleanFilename.match(sdpPattern);
    
    if (sdpMatch) {
      return this.parseSdpFormat(sdpMatch[1], sdpMatch[2], sdpMatch[3], filename);
    }
    
    // FORMAT 2: Servis__MicropaymentMerchantReport_[...]_MERCHANTID__DATES.xls
    const micropaymentPattern = /Servis__MicropaymentMerchantReport_(.+?)_(\d+)__(\d{8})_\d{4}__(\d{8})_\d{4}\.xls$/i;
    const micropaymentMatch = cleanFilename.match(micropaymentPattern);
    
    if (micropaymentMatch) {
      return this.parseMicropaymentFormat(
        micropaymentMatch[1], // Full middle part
        micropaymentMatch[2], // Merchant ID
        micropaymentMatch[3], // Start date
        filename
      );
    }
    
    throw new Error(`Unknown file format: ${filename}`);
  }

  // ========================================
  // ✅ SDP FORMAT PARSER
  // ========================================
  
  private parseSdpFormat(
    providerRaw: string,
    contractTypeRaw: string,
    dateStr: string,
    filename: string
  ): FileParseResult {
    // Normalizuj provider naziv - ukloni whitespace i napravi uppercase
    const providerKey = providerRaw.trim().replace(/\s+/g, '').toUpperCase();
    const providerName = this.PROVIDER_NORMALIZATION[providerKey] || providerRaw.trim();
    
    // Normalizuj contract type
    const contractType = contractTypeRaw.trim().toUpperCase();
    
    // Ekstraktuj datum
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    
    // Dobij revenue share
    const revenueShare = this.REVENUE_SHARE_MAP[providerName]?.[contractType] || 50;
    
    // Generiši contract number
    const contractNumber = `SDP-${providerName.replace(/\s/g, '')}-${contractType}-${year}`;
    
    return {
      provider: {
        id: '', // Biće popunjeno kasnije
        name: providerName,
        displayName: providerRaw.trim(),
        folderName: this.createSafeFolderName(providerName)
      },
      contract: {
        contractType,
        contractNumber,
        revenueShare,
        contractName: `${providerName}_${contractType}`
      },
      year,
      month,
      format: 'SDP'
    };
  }

  // ========================================
  // ✅ MICROPAYMENT FORMAT PARSER
  // ========================================
  
  private parseMicropaymentFormat(
    middlePart: string,
    merchantId: string,
    startDateStr: string,
    filename: string
  ): FileParseResult {
    let providerName = '';
    let contractType = 'GENERAL';
    let isDCB = false;
    
    // Parse middle part
    // Moguće varijante:
    // 1. "EKG" -> Processcom, GENERAL
    // 2. "NPay_Apps" -> Nuewoo, APPS
    // 3. "SDP_Standard_CePP" -> JP Posta, STANDARD
    // 4. "SDP_Media_Akton" -> Akton, MEDIA
    // 5. "NTHDCB_Apps" -> NTH, DCB_APPS
    
    const parts = middlePart.split('_').map(p => p.trim()).filter(p => p);
    
    // Check if it's NTHDCB format
    if (parts[0].toUpperCase().includes('NTHDCB')) {
      isDCB = true;
      providerName = 'NTH';
      if (parts.length > 1) {
        contractType = `DCB_${parts[1].toUpperCase()}`;
      }
    }
    // Check if it starts with "SDP"
    else if (parts[0].toUpperCase() === 'SDP') {
      // Format: SDP_Type_Provider
      if (parts.length >= 3) {
        contractType = parts[1].toUpperCase();
        const providerPart = parts.slice(2).join('_');
        const providerKey = providerPart.replace(/\s+/g, '').toUpperCase();
        providerName = this.PROVIDER_NORMALIZATION[providerKey] || providerPart;
      }
    }
    // Simple formats like "EKG" or "NPay_Apps"
    else {
      if (parts.length === 1) {
        // Just provider name
        const providerKey = parts[0].replace(/\s+/g, '').toUpperCase();
        providerName = this.PROVIDER_NORMALIZATION[providerKey] || parts[0];
        contractType = 'GENERAL';
      } else {
        // Provider_Type format
        const providerKey = parts[0].replace(/\s+/g, '').toUpperCase();
        providerName = this.PROVIDER_NORMALIZATION[providerKey] || parts[0];
        contractType = parts[1].toUpperCase();
      }
    }
    
    // Fallback if provider name is still empty
    if (!providerName) {
      const firstPart = parts[0].replace(/\s+/g, '').toUpperCase();
      providerName = this.PROVIDER_NORMALIZATION[firstPart] || parts[0];
    }
    
    // Ekstraktuj datum
    const year = startDateStr.substring(0, 4);
    const month = startDateStr.substring(4, 6);
    
    // Dobij revenue share
    const revenueShare = this.REVENUE_SHARE_MAP[providerName]?.[contractType] || 50;
    
    // Contract number je Merchant ID
    const contractNumber = `MID-${merchantId}`;
    
    return {
      provider: {
        id: '',
        name: providerName,
        displayName: providerName,
        folderName: this.createSafeFolderName(providerName)
      },
      contract: {
        contractType,
        contractNumber,
        revenueShare,
        contractName: `${providerName}_${contractType}_${merchantId}`
      },
      year,
      month,
      format: 'MICROPAYMENT'
    };
  }

  // ========================================
  // ✅ FOLDER NAME CREATION
  // ========================================
  
  private createSafeFolderName(providerName: string): string {
    return providerName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  // ========================================
  // ✅ PROVIDER MANAGEMENT
  // ========================================
  
  async getOrCreateProvider(providerName: string): Promise<ProviderInfo> {
    if (this.providerCache.has(providerName)) {
      return this.providerCache.get(providerName)!;
    }

    let provider = await prisma.provider.findFirst({
      where: { 
        name: {
          equals: providerName,
          mode: 'insensitive'
        }
      }
    });

    if (!provider) {
      provider = await prisma.provider.create({
        data: {
          name: providerName,
          isActive: true
        }
      });
      
      await this.logActivity(
        'Provider',
        provider.id,
        'CREATE',
        `Created provider ${providerName}`
      );
    }

    const providerInfo: ProviderInfo = {
      id: provider.id,
      name: providerName,
      displayName: providerName,
      folderName: this.createSafeFolderName(providerName)
    };

    this.providerCache.set(providerName, providerInfo);
    return providerInfo;
  }

  // ========================================
  // ✅ CONTRACT MANAGEMENT
  // ========================================
  
  async getOrCreateContract(
    providerId: string,
    contractInfo: ContractInfo
  ): Promise<any> {
    const existingContract = await prisma.contract.findFirst({
      where: {
        providerId,
        contractNumber: contractInfo.contractNumber
      }
    });

    if (existingContract) {
      // Update revenue share ako se promenio
      if (existingContract.revenuePercentage !== contractInfo.revenueShare) {
        await prisma.contract.update({
          where: { id: existingContract.id },
          data: { revenuePercentage: contractInfo.revenueShare }
        });
      }
      return existingContract;
    }

    // Kreiraj novi ugovor
    const newContract = await prisma.contract.create({
      data: {
        name: contractInfo.contractName,
        contractNumber: contractInfo.contractNumber,
        type: 'PROVIDER',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        providerId,
        createdById: this.currentUserId,
        revenuePercentage: contractInfo.revenueShare,
        description: `${contractInfo.contractType} ugovor (${contractInfo.revenueShare}% revenue share)`
      }
    });

    await this.logActivity(
      'Contract',
      newContract.id,
      'CREATE',
      `Created contract ${contractInfo.contractName} with ${contractInfo.revenueShare}% revenue share`
    );

    return newContract;
  }

  // ========================================
  // ✅ DIRECTORY MANAGEMENT
  // ========================================
  
  async createProviderDirectory(
    providerInfo: ProviderInfo,
    year: string,
    month?: string | null
  ): Promise<string> {
    const parts = [
      PROJECT_ROOT,
      'public',
      'providers',
      providerInfo.folderName,
      'reports',
      year
    ];

    if (month) {
      parts.push(month);
    }

    const basePath = path.join(...parts);
    await fs.mkdir(basePath, { recursive: true });
    
    return basePath;
  }

  private async generateUniqueFilename(targetDir: string, filename: string): Promise<string> {
    const ext = path.extname(filename);
    const nameWithoutExt = path.basename(filename, ext);
    let finalFilename = filename;
    let counter = 1;

    while (true) {
      const fullPath = path.join(targetDir, finalFilename);
      try {
        await fs.access(fullPath);
        finalFilename = `${nameWithoutExt}_${counter}${ext}`;
        counter++;
      } catch {
        break;
      }
    }

    return finalFilename;
  }

  async moveFileToProviderDirectory(
    sourceFile: string,
    providerId: string,
    providerName: string,
    filename: string
  ): Promise<string | null> {
    try {
      const parseResult = this.parseFilename(filename);
      const providerInfo = await this.getOrCreateProvider(providerName);
      
      const targetDir = await this.createProviderDirectory(
        providerInfo,
        parseResult.year,
        parseResult.month
      );
      
      const uniqueFilename = await this.generateUniqueFilename(targetDir, filename);
      const targetFile = path.join(targetDir, uniqueFilename);
      
      await fs.rename(sourceFile, targetFile);
      
      console.log(`✅ File moved: ${targetFile.replace(PROJECT_ROOT, '')}`);
      
      await this.logActivity(
        'Provider',
        providerId,
        'FILE_MOVED',
        `File moved to ${targetFile.replace(PROJECT_ROOT, '')}`
      );
      
      return targetFile;
      
    } catch (error) {
      console.error('❌ Error moving file:', error);
      
      try {
        const errorFile = path.join(ERROR_FOLDER, path.basename(sourceFile));
        await fs.rename(sourceFile, errorFile);
      } catch (moveError) {
        console.error('❌ Could not move file to error folder:', moveError);
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

  // ========================================
  // ✅ FILE PROCESSING
  // ========================================
  
  async processExcelFile(inputFile: string): Promise<FileProcessResult> {
    try {
      const filename = path.basename(inputFile);
      
      // Parse filename to get all info
      const parseResult = this.parseFilename(filename);
      
      console.log(`\n📋 Processing: ${filename}`);
      console.log(`   Provider: ${parseResult.provider.name}`);
      console.log(`   Contract: ${parseResult.contract.contractType}`);
      console.log(`   Revenue: ${parseResult.contract.revenueShare}%`);
      console.log(`   Format: ${parseResult.format}`);
      
      // Get or create provider
      const providerInfo = await this.getOrCreateProvider(parseResult.provider.name);
      parseResult.provider.id = providerInfo.id;
      
      // Get or create contract
      const contract = await this.getOrCreateContract(
        providerInfo.id,
        parseResult.contract
      );
      
      // Process Excel file
      const fileBuffer = await fs.readFile(inputFile);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const allSheetsData: VasRecord[] = [];
      
      const serviceNamesInFile = new Set<string>();
      const serviceIdMapping: { [key: string]: string } = {};

      // Process sheets (starting from index 3)
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
                allSheetsData.push({
                  providerId: providerInfo.id,
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
      }

      // Create services
      for (const serviceName of serviceNamesInFile) {
        const serviceCode = this.extractServiceCode(serviceName);
        const { service } = await this.getOrCreateService(serviceName, 'VAS', 'PREPAID', serviceCode);
        serviceIdMapping[serviceName] = service.id;
        await this.getOrCreateServiceContract(service.id, contract.id);
      }

      // Update records with service IDs
      for (const record of allSheetsData) {
        if (serviceIdMapping[record.serviceName]) {
          record.serviceId = serviceIdMapping[record.serviceName];
        }
      }

      const logs: string[] = [
        `ℹ️ Contract: ${contract.contractNumber} (${parseResult.contract.revenueShare}% revenue)`,
        `ℹ️ Provider: ${parseResult.provider.name}`,
        `ℹ️ Type: ${parseResult.contract.contractType}`,
        `ℹ️ Format: ${parseResult.format}`
      ];

      return {
        records: allSheetsData,
        providerId: providerInfo.id,
        providerName: parseResult.provider.name,
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

  // ========================================
  // ✅ HELPER METHODS
  // ========================================

  extractServiceCode(serviceName: string): string | null {
    if (!serviceName) return null;
    const pattern = /(?<!\d)(\d{4})(?!\d)/;
    const match = serviceName.toString().match(pattern);
    return match ? match[1] : null;
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

  async getOrCreateService(
    serviceName: string,
    serviceType: ServiceType = 'VAS',
    billingType: BillingType = 'PREPAID',
    serviceCode?: string | null
  ) {
    let service = await prisma.service.findFirst({
      where: { name: serviceName }
    });

    if (!service) {
      service = await prisma.service.create({
        data: {
          name: serviceName,
          type: serviceType,
          billingType,
          description: `Auto-created VAS service: ${serviceName}${serviceCode ? ` (${serviceCode})` : ''}`,
          isActive: true
        }
      });
      
      await this.logActivity('Service', service.id, 'CREATE', `Created service ${serviceName}`);
    }

    return { service };
  }

  async getOrCreateServiceContract(serviceId: string, contractId: string) {
    let serviceContract = await prisma.serviceContract.findFirst({
      where: { serviceId, contractId }
    });

    if (!serviceContract) {
      serviceContract = await prisma.serviceContract.create({
        data: { serviceId, contractId }
      });
      
      await this.logActivity('ServiceContract', serviceContract.id, 'CREATE', 'Created service contract connection');
    }

    return { serviceContract };
  }

  private mergeRecords(records: VasRecord[]): VasRecord[] {
    const mergedMap = new Map<string, VasRecord>();

    for (const record of records) {
      const key = `${record.date}_${record.serviceName}_${record.group}`;
      
      if (!mergedMap.has(key)) {
        mergedMap.set(key, { ...record });
        if (record.quantity === 0 && record.amount !== 0) {
          mergedMap.get(key)!.quantity = record.amount > 0 ? 1 : -1;
        }
      } else {
        const existing = mergedMap.get(key)!;
        
        if (existing.price > 0 && record.price < 0) {
          existing.quantity = Math.max(0, existing.quantity - Math.abs(record.quantity));
          existing.amount += record.amount;
          
          if (existing.quantity === 0 && existing.amount < 0) {
            existing.price = record.price;
            existing.quantity = Math.abs(record.quantity);
          }
        } else if (existing.price < 0 && record.price < 0) {
          existing.quantity += record.quantity;
          existing.amount += record.amount;
        } else if (existing.price < 0 && record.price > 0) {
          existing.quantity = Math.max(0, Math.abs(existing.quantity) - record.quantity);
          existing.amount += record.amount;
          
          if (existing.quantity === 0 && existing.amount > 0) {
            existing.price = record.price;
            existing.quantity = record.quantity;
          }
        }
      }
    }

    for (const [_, record] of mergedMap) {
      if (record.amount < 0 && record.quantity > 0) {
        record.quantity = -record.quantity;
      } else if (record.amount > 0 && record.quantity < 0) {
        record.quantity = Math.abs(record.quantity);
      }
    }

    return Array.from(mergedMap.values());
  }

  async importRecordsToDatabase(
    records: VasRecord[]
  ): Promise<{ logs: string[]; inserted: number; updated: number; errors: number }> {
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
          logs.push(`🔄 Record ${index+1}: Updated ${record.serviceName} on ${record.date}`);
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
          logs.push(`✅ Record ${index+1}: Created ${record.serviceName} on ${record.date}`);
        }
      } catch (error: any) {
        errors++;
        logs.push(`❌ Record ${index+1}: Failed - ${error.message || 'Unknown error'}`);
      }
    }

    logs.push(
      `\nImport summary:`,
      `✅ ${inserted} inserted`,
      `🔄 ${updated} updated`,
      `❌ ${errors} failed`
    );

    return { logs, inserted, updated, errors };
  }

  async ensureDirectories(): Promise<void> {
    const dirs = [FOLDER_PATH, PROCESSED_FOLDER, ERROR_FOLDER, path.join(PROJECT_ROOT, 'public', 'providers')];
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async logActivity(
    entityType: string,
    entityId: string,
    action: string,
    description: string,
    errorDetails?: string,
    level: 'INFO' | 'WARNING' | 'ERROR' = 'INFO'
  ): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          entityType,
          entityId,
          action,
          details: description,
          severity: level === 'INFO' ? 'INFO' : level === 'WARNING' ? 'WARNING' : 'ERROR',
          userId: this.currentUserId,
        }
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  async processAllFiles(): Promise<void> {
    await this.ensureDirectories();
    
    const files = await glob(path.join(FOLDER_PATH, '*.xls*'));
    
    if (files.length === 0) {
      console.log('📭 No files found in input folder');
      return;
    }
    
    console.log(`📂 Found ${files.length} file(s) to process\n`);
    
    for (const file of files) {
      try {
        const result = await this.processExcelFile(file);
        
        if (result.records.length > 0) {
          const importResult = await this.importRecordsToDatabase(result.records);
          console.log(`\n✅ Import complete for ${path.basename(file)}`);
          console.log(`   Inserted: ${importResult.inserted}`);
          console.log(`   Updated: ${importResult.updated}`);
          console.log(`   Errors: ${importResult.errors}`);
          
          // Move file to provider directory
          await this.moveFileToProviderDirectory(
            file,
            result.providerId,
            result.providerName,
            path.basename(file)
          );
        } else {
          console.log(`⚠️  No valid records found in ${path.basename(file)}`);
          
          // Move to error folder
          const errorFile = path.join(ERROR_FOLDER, path.basename(file));
          await fs.rename(file, errorFile);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${path.basename(file)}:`, error);
        
        // Move to error folder
        try {
          const errorFile = path.join(ERROR_FOLDER, path.basename(file));
          await fs.rename(file, errorFile);
        } catch (moveError) {
          console.error(`❌ Could not move file to error folder:`, moveError);
        }
      }
    }
    
    console.log('\n🎉 All files processed!');
  }
}

export { VasImportService };
export type { FileParseResult, VasRecord, FileProcessResult, ProviderInfo, ContractInfo };