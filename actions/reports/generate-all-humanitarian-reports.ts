// actions/reports/generate-all-humanitarian-reports.ts - IMPROVED VERSION
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { db } from "@/lib/db";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { generateOrganizationFolderName } from "@/utils/report-path";
import * as XLSX from 'xlsx';

// ============================================
// TYPES & INTERFACES
// ============================================

interface ReportGenerationResult {
  success: boolean;
  message: string;
  processed: number;
  errors?: string[];
  generatedFiles?: {
    organizationName: string;
    fileName: string;
    status: 'success' | 'error';
    message?: string;
  }[];
}

interface OrganizationData {
  id: string;
  name: string;
  accountNumber: string | null;
  pib: string | null;
  registrationNumber: string | null;
  shortNumber: string | null;
  mission: string | null;
  bank: string | null;
  activeContract?: {
    name: string;
    contractNumber?: string;
    startDate?: Date;
    endDate?: Date;
  } | null;
}

interface OrganizationReportData {
  id: string;
  name: string;
  accountNumber: string | null;
  registrationNumber: string | null;
  pib: string | null;
  shortNumber: string | null;
  mission: string | null;
  contracts: Array<{
    name: string;
    contractNumber: string | null;
    startDate: Date | null;
  }>;
  monthlyRevenue?: number;
  totalTransactions?: number;
  serviceUsage?: {
    postpaid?: number;
    prepaid?: number;
  };
}

interface CounterData {
  totalReports: number;
  validReportsCount: number;
  createdAt: string;
  lastUpdated: string;
  month: number;
  year: number;
  generationType: string;
  processedOrganizations: Array<{
    name: string;
    timestamp: string;
    value: number;
    counterAssigned: number | null;
  }>;
}

interface DateParseResult {
  startDate: Date | null;
  endDate: Date | null;
  month: number | null;
  year: number | null;
  isValid: boolean;
}

interface CellUpdate {
  cell: string;
  value: any;
}

type PaymentType = 'prepaid' | 'postpaid';
type TemplateType = 'telekom' | 'globaltel';
type GenerationType = 'templates' | 'complete-reports';

// ============================================
// CONSTANTS
// ============================================

const TEMPLATES_PATH = path.join(process.cwd(), 'templates');
const REPORTS_BASE_PATH = path.join(process.cwd(), 'reports');
const ORIGINAL_REPORTS_PATH = path.join(process.cwd(), 'public', 'reports');

const MONTHS_SR = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
  'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
] as const;

// Cyrillic to Latin transliteration map
const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
  'а': 'a', 'А': 'A', 'б': 'b', 'Б': 'B', 'в': 'v', 'В': 'V',
  'г': 'g', 'Г': 'G', 'д': 'd', 'Д': 'D', 'ђ': 'dj', 'Ђ': 'Dj',
  'е': 'e', 'Е': 'E', 'ж': 'z', 'Ж': 'Z', 'з': 'z', 'З': 'Z',
  'и': 'i', 'И': 'I', 'ј': 'j', 'Ј': 'J', 'к': 'k', 'К': 'K',
  'л': 'l', 'Л': 'L', 'љ': 'lj', 'Љ': 'Lj', 'м': 'm', 'М': 'M',
  'н': 'n', 'Н': 'N', 'њ': 'nj', 'Њ': 'Nj', 'о': 'o', 'О': 'O',
  'п': 'p', 'П': 'P', 'р': 'r', 'Р': 'R', 'с': 's', 'С': 'S',
  'т': 't', 'Т': 'T', 'ћ': 'c', 'Ћ': 'C', 'у': 'u', 'У': 'U',
  'ф': 'f', 'Ф': 'F', 'х': 'h', 'Х': 'H', 'ц': 'c', 'Ц': 'C',
  'ч': 'c', 'Ч': 'C', 'џ': 'dz', 'Џ': 'Dz', 'ш': 's', 'Ш': 'S'
};

// ============================================
// SIMPLIFIED COUNTER SYSTEM
// ============================================

class GlobalCounterManager {
  private static readonly lockFiles = new Map<string, Promise<void>>();
  private static currentCounterPath: string | null = null;

  private static generateCounterFileName(): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .substring(0, 19);
    
    return `counter_${timestamp}.json`;
  }

  private static async createNewCounterFile(
    month: number,
    year: number,
    generationType: GenerationType
  ): Promise<string> {
    const counterFolderPath = path.join(
      REPORTS_BASE_PATH,
      'global-counters',
      year.toString(),
      month.toString().padStart(2, '0')
    );
    
    await fs.mkdir(counterFolderPath, { recursive: true });

    const fileName = this.generateCounterFileName();
    const filePath = path.join(counterFolderPath, fileName);

    const initialData: CounterData = {
      totalReports: 0,
      validReportsCount: 0,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      month,
      year,
      generationType,
      processedOrganizations: []
    };

    await fs.writeFile(filePath, JSON.stringify(initialData, null, 2));
    console.log(`✅ Created NEW counter file: ${fileName} for ${generationType}`);
    
    return filePath;
  }

  static startNewGeneration(): void {
    this.currentCounterPath = null;
    console.log('🔄 Started new generation - counter will be created on first increment');
  }

  static finishGeneration(): void {
    if (this.currentCounterPath) {
      console.log(`✅ Finished generation using: ${path.basename(this.currentCounterPath)}`);
      this.currentCounterPath = null;
    }
  }

  static async incrementIfValid(
    month: number,
    year: number,
    reportValue: number,
    organizationName: string,
    generationType: GenerationType = 'templates'
  ): Promise<number | null> {
    if (reportValue <= 0) {
      console.log(`${organizationName}: reportValue=${reportValue}, counter se ne uvećava`);
      return null;
    }

    const lockKey = `${year}-${month.toString().padStart(2, '0')}-${generationType}`;
    
    // Thread-safe locking
    while (this.lockFiles.has(lockKey)) {
      await this.lockFiles.get(lockKey);
    }

    const lockPromise = this._performIncrement(month, year, reportValue, organizationName, generationType);
    this.lockFiles.set(lockKey, lockPromise);

    try {
      return await lockPromise;
    } finally {
      this.lockFiles.delete(lockKey);
    }
  }

  private static async _performIncrement(
    month: number,
    year: number,
    reportValue: number,
    organizationName: string,
    generationType: GenerationType
  ): Promise<number | null> {
    try {
      if (!this.currentCounterPath) {
        this.currentCounterPath = await this.createNewCounterFile(month, year, generationType);
        console.log(`🆕 NEW GENERATION: Created ${path.basename(this.currentCounterPath)}`);
      }

      const fileContent = await fs.readFile(this.currentCounterPath, 'utf8');
      const counterData: CounterData = JSON.parse(fileContent);

      counterData.totalReports += 1;
      counterData.validReportsCount += 1;
      const newCounterValue = counterData.validReportsCount;

      counterData.processedOrganizations.push({
        name: organizationName,
        timestamp: new Date().toISOString(),
        value: reportValue,
        counterAssigned: newCounterValue
      });

      counterData.lastUpdated = new Date().toISOString();

      await fs.writeFile(this.currentCounterPath, JSON.stringify(counterData, null, 2));

      console.log(`${organizationName}: Dodeljen counter broj ${newCounterValue} (reportValue=${reportValue}) [${generationType}] -> ${path.basename(this.currentCounterPath)}`);
      return newCounterValue;
    } catch (error) {
      console.error(`Error updating global counter for ${month}/${year}:`, error);
      return null;
    }
  }

  static async getCurrentCounter(month: number, year: number): Promise<number> {
    try {
      if (this.currentCounterPath) {
        const fileContent = await fs.readFile(this.currentCounterPath, 'utf8');
        const counterData: CounterData = JSON.parse(fileContent);
        return counterData.validReportsCount || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function sanitizeFileName(orgName: string, maxLength: number = 50): string {
  if (!orgName?.trim()) {
    return 'unknown_org';
  }

  let sanitized = orgName.trim().replace(/\s+/g, ' ');
  
  // Cyrillic to Latin transliteration
  for (const [cyrillic, latin] of Object.entries(CYRILLIC_TO_LATIN_MAP)) {
    sanitized = sanitized.replace(new RegExp(cyrillic, 'g'), latin);
  }
  
  return sanitized
    .replace(/\s/g, '_')
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/[„"""'']/g, '')
    .replace(/[–—]/g, '-')
    .replace(/[•]/g, '_')
    .replace(/[…]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, maxLength)
    .replace(/_+$/, '') || 'org';
}

function getMasterTemplatePath(templateType: TemplateType): string {
  return path.join(TEMPLATES_PATH, `humanitarian-template-${templateType}.xlsx`);
}

function extractDatesFromFileName(fileName: string): DateParseResult {
  console.log('Parsing filename:', fileName);

  // Pattern 1: full datetime range __YYYYMMDD_HHMM__YYYYMMDD_HHMM__
  const datePatternFull = /__(\d{8}_\d{4})__(\d{8}_\d{4})\./;
  const matchFull = fileName.match(datePatternFull);

  if (matchFull) {
    const [, startDateStr, endDateStr] = matchFull;
    
    const parseDateTime = (dateStr: string): Date => {
      return new Date(
        parseInt(dateStr.substr(0, 4)),
        parseInt(dateStr.substr(4, 2)) - 1,
        parseInt(dateStr.substr(6, 2)),
        parseInt(dateStr.substr(9, 2)),
        parseInt(dateStr.substr(11, 2))
      );
    };

    const startDate = parseDateTime(startDateStr);
    const endDate = parseDateTime(endDateStr);

    return {
      startDate,
      endDate,
      month: startDate.getMonth() + 1,
      year: startDate.getFullYear(),
      isValid: true
    };
  }

  // Pattern 2: YYYYMMDD
  const datePatternDay = /(\d{8})/;
  const matchDay = fileName.match(datePatternDay);

  if (matchDay) {
    const dateStr = matchDay[1];
    const year = parseInt(dateStr.substr(0, 4));
    const month = parseInt(dateStr.substr(4, 2));

    const startDate = new Date(year, month - 1, 1, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59);

    console.log('Found day pattern:', { year, month, startDate, endDate });

    return {
      startDate,
      endDate,
      month,
      year,
      isValid: true
    };
  }

  console.log('No date pattern found in filename');
  return {
    startDate: null,
    endDate: null,
    month: null,
    year: null,
    isValid: false
  };
}

// NOVA FUNKCIJA - Provera da li fajl odgovara određenom tipu plaćanja
function isFileForPaymentType(fileName: string, paymentType: PaymentType): boolean {
  const lowerFileName = fileName.toLowerCase();
  
  if (paymentType === 'postpaid') {
    // Postpaid fajlovi uvek imaju "postpaid" u imenu
    const hasPostpaid = lowerFileName.includes('postpaid');
    console.log(`File ${fileName} - contains 'postpaid': ${hasPostpaid}`);
    return hasPostpaid;
  } else {
    // Prepaid fajlovi su svi ostali (koji nemaju "postpaid" u imenu)
    const hasPostpaid = lowerFileName.includes('postpaid');
    const isPrepaid = !hasPostpaid;
    console.log(`File ${fileName} - is prepaid (no 'postpaid'): ${isPrepaid}`);
    return isPrepaid;
  }
}

// AŽURIRANA FUNKCIJA - Sada proverava i datum i tip plaćanja
function isFileForPeriodAndPaymentType(
  fileName: string, 
  targetMonth: number, 
  targetYear: number, 
  paymentType: PaymentType
): boolean {
  const dates = extractDatesFromFileName(fileName);
  
  if (!dates.isValid) {
    console.log(`File ${fileName} - datumi nisu validni`);
    return false;
  }
  
  const dateMatches = dates.month === targetMonth && dates.year === targetYear;
  const paymentMatches = isFileForPaymentType(fileName, paymentType);
  
  const overallMatch = dateMatches && paymentMatches;
  
  console.log(`File ${fileName} - date matches ${targetMonth}/${targetYear}: ${dateMatches}, payment type ${paymentType}: ${paymentMatches}, overall: ${overallMatch}`);
  
  return overallMatch;
}

function formatContractInfo(contracts: OrganizationReportData['contracts']): string {
  console.log('\n🔍 === formatContractInfo DEBUG ===');
  console.log('Input contracts:', JSON.stringify(contracts, null, 2));
  console.log('Contracts type:', typeof contracts);
  console.log('Is array:', Array.isArray(contracts));
  console.log('Length:', contracts?.length);
  
  if (!contracts || !Array.isArray(contracts) || contracts.length === 0) {
    console.log('❌ No contracts array or empty array');
    return '';
  }
  
  const activeContract = contracts[0];
  console.log('\n📄 Active contract object:', activeContract);
  console.log('   - name:', activeContract.name, '(type:', typeof activeContract.name, ')');
  console.log('   - startDate:', activeContract.startDate, '(type:', typeof activeContract.startDate, ')');
  console.log('   - startDate instanceof Date:', activeContract.startDate instanceof Date);
  
  // Check if name exists
  if (!activeContract.name) {
    console.log('❌ Contract name is missing');
    return '';
  }
  
  // Robust date parsing
  let startDate: Date | null = null;
  if (activeContract.startDate) {
    try {
      console.log('   Attempting to parse startDate...');
      
      if (activeContract.startDate instanceof Date) {
        console.log('   ✓ Already a Date object');
        startDate = activeContract.startDate;
      } else {
        console.log('   Converting to Date from:', typeof activeContract.startDate);
        startDate = new Date(activeContract.startDate as any);
      }
      
      // Validate date
      if (isNaN(startDate.getTime())) {
        console.log('   ❌ Invalid date (NaN):', activeContract.startDate);
        startDate = null;
      } else {
        console.log('   ✅ Valid date parsed:', startDate.toISOString());
      }
    } catch (error) {
      console.error('   ❌ Error parsing startDate:', error);
      startDate = null;
    }
  } else {
    console.log('   ⚠️ startDate is null/undefined');
  }
  
  // Build contract info string
  if (activeContract.name && startDate) {
    const formattedDate = format(startDate, 'dd.MM.yyyy');
    const result = `Уговор бр ${activeContract.name} од ${formattedDate}`;
    console.log('✅ SUCCESS: Contract info with date:', result);
    console.log('=== formatContractInfo END ===\n');
    return result;
  }
  
  if (activeContract.name) {
    const result = `Уговор бр ${activeContract.name}`;
    console.log('⚠️ PARTIAL: Contract info without date:', result);
    console.log('=== formatContractInfo END ===\n');
    return result;
  }
  
  console.log('❌ FAILED: No contract name found');
  console.log('=== formatContractInfo END ===\n');
  return '';
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw error;
  }
}

async function safeFileDelete(filePath: string): Promise<void> {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
  } catch {
    // File doesn't exist, which is fine
  }
}

// ============================================
// DATA FETCHING
// ============================================

async function getOrganizationsWithReportData(
  month: number,
  year: number,
  paymentType: PaymentType
): Promise<OrganizationReportData[]> {
  const currentDate = new Date();
  console.log(`\n🔍 Fetching organizations with contracts where:`);
  console.log(`   - status = 'ACTIVE'`);
  console.log(`   - startDate <= ${currentDate.toISOString()}`);
  console.log(`   - endDate >= ${currentDate.toISOString()}`);
  
  const organizations = await db.humanitarianOrg.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      accountNumber: true,
      registrationNumber: true,
      pib: true,
      shortNumber: true,
      mission: true,
      bank: true,
      contracts: {
        where: {
          status: 'ACTIVE',
          startDate: { lte: currentDate },
          endDate: { gte: currentDate }
        },
        select: {
          name: true,
          contractNumber: true,
          startDate: true,
        },
        orderBy: {
          startDate: 'desc'
        },
        take: 1
      }
    }
  });

  console.log(`\n=== FETCHED ${organizations.length} ORGANIZATIONS ===\n`);

  const enhancedOrganizations: OrganizationReportData[] = [];

  for (const org of organizations) {
    console.log(`\n📋 Processing: ${org.name}`);
    console.log(`   Contracts in DB result: ${org.contracts?.length || 0}`);
    
    // CRITICAL DEBUGGING: Check ALL contracts for this org (not just active ones)
    if (org.contracts.length === 0) {
      console.log(`   ⚠️ NO ACTIVE CONTRACTS - Fetching most recent contract as fallback...`);
      try {
        const fallbackContract = await db.contract.findFirst({
          where: { 
            humanitarianOrgId: org.id,
            status: 'ACTIVE'  // Mora biti aktivan status, ali ignorišemo datume
          },
          select: {
            name: true,
            contractNumber: true,
            startDate: true,
          },
          orderBy: { startDate: 'desc' }  // Uzmi najnoviji
        });
        
        if (fallbackContract) {
          console.log(`   ✅ FALLBACK: Using most recent contract: ${fallbackContract.name}`);
          org.contracts = [fallbackContract];
        } else {
          console.log(`   ❌ No contracts found at all for ${org.name}`);
        }
      } catch (debugError) {
        console.error(`   ❌ Error fetching fallback contract:`, debugError);
      }
    }
    
    if (org.contracts && org.contracts.length > 0) {
      const rawContract = org.contracts[0];
      console.log(`   RAW contract data:`, JSON.stringify(rawContract, null, 2));
      console.log(`   - name: "${rawContract.name}" (type: ${typeof rawContract.name})`);
      console.log(`   - startDate: ${rawContract.startDate} (type: ${typeof rawContract.startDate})`);
      console.log(`   - startDate instanceof Date: ${rawContract.startDate instanceof Date}`);
    } else {
      console.log(`   ⚠️ NO CONTRACTS FOUND FOR ${org.name}`);
    }

    const monthlyData = await getMonthlyDataForOrganization(
      org.id, 
      org.shortNumber || '', 
      month, 
      year, 
      paymentType
    );

    // CRITICAL FIX: Force proper date conversion
    const serializedContracts = (org.contracts || []).map(contract => {
      let parsedDate: Date | null = null;
      
      if (contract.startDate) {
        try {
          // MORE ROBUST date parsing
          let dateToConvert = contract.startDate;
          
          // Handle Prisma Date objects that might be strings
          if (typeof dateToConvert === 'string') {
            console.log(`   📅 ${org.name}: startDate is string: "${dateToConvert}"`);
            parsedDate = new Date(dateToConvert);
          } else if (dateToConvert instanceof Date) {
            console.log(`   📅 ${org.name}: startDate is Date object`);
            parsedDate = new Date(dateToConvert.getTime()); // Clone to avoid mutations
          } else if (dateToConvert && typeof dateToConvert === 'object') {
            // Handle cases where Prisma returns Date-like objects
            console.log(`   📅 ${org.name}: startDate is object, attempting conversion`);
            parsedDate = new Date(dateToConvert.toString());
          }
          
          // Verify it's a valid date
          if (!parsedDate || isNaN(parsedDate.getTime())) {
            console.error(`   ❌ Invalid date for ${org.name}: ${contract.startDate} (type: ${typeof contract.startDate})`);
            console.error(`   💡 DEBUGGING: Check if contract.startDate is null in database!`);
            parsedDate = null;
          } else {
            console.log(`   ✅ Parsed startDate for ${org.name}: ${parsedDate.toISOString()} (original: ${contract.startDate})`);
          }
        } catch (err) {
          console.error(`   ❌ Date parsing error for ${org.name}:`, err);
          console.error(`   📝 Original value: ${contract.startDate} (type: ${typeof contract.startDate})`);
          parsedDate = null;
        }
      } else {
        console.warn(`   ⚠️ ${org.name}: contract.startDate is NULL or UNDEFINED in database!`);
      }
      
      return {
        name: contract.name,
        contractNumber: contract.contractNumber,
        startDate: parsedDate,
      };
    });

    console.log(`   Final serialized contracts for ${org.name}:`, 
      JSON.stringify(serializedContracts, null, 2));

    enhancedOrganizations.push({
      ...org,
      contracts: serializedContracts,
      monthlyRevenue: monthlyData.revenue,
      totalTransactions: monthlyData.transactions,
      serviceUsage: monthlyData.serviceUsage
    });
  }

  console.log(`\n=== FINISHED PROCESSING ALL ORGANIZATIONS ===\n`);
  return enhancedOrganizations;
}

async function getMonthlyDataForOrganization(
  orgId: string,
  shortNumber: string,
  month: number,
  year: number,
  paymentType: PaymentType
) {
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  try {
    // Default values if no transaction table exists
    return {
      revenue: 0,
      transactions: 0,
      serviceUsage: { postpaid: 0, prepaid: 0 }
    };
    
    // Uncomment and modify when you have actual transaction table:
    /*
    const transactions = await db.$queryRaw`
      SELECT
        COALESCE(SUM(quantity), 0) as transaction_count,
        COALESCE(SUM(amount), 0) as total_amount,
        "group" as payment_group
      FROM your_transactions_table
      WHERE service_code = ${shortNumber}
        AND "group" = ${paymentType}
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY "group"
    ` as Array<{
      transaction_count: bigint;
      total_amount: bigint;
      payment_group: string;
    }>;

    const revenue = transactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
    const transactionCount = transactions.reduce((sum, t) => sum + Number(t.transaction_count), 0);

    return {
      revenue,
      transactions: transactionCount,
      serviceUsage: { [paymentType]: transactionCount }
    };
    */
  } catch (error) {
    console.error(`Error fetching data for organization ${orgId}:`, error);
    return {
      revenue: 0,
      transactions: 0,
      serviceUsage: { postpaid: 0, prepaid: 0 }
    };
  }
}
// ============================================
// EXCEL READING FUNCTIONS
// ============================================

async function readExcelValue(filePath: string, paymentType: PaymentType): Promise<number> {
  const xlsFile = path.basename(filePath);
  
  try {
    let value = 0;

    if (xlsFile.toLowerCase().endsWith('.xls')) {
      console.log('Reading .xls file with SheetJS...');
      value = await readXlsFile(filePath, paymentType);
    } else {
      console.log('Reading .xlsx file with ExcelJS...');
      value = await readXlsxFile(filePath, paymentType);
    }

    console.log(`Final extracted value: ${value}`);
    return value;
  } catch (readError) {
    console.log('❌ Failed to read Excel file:', readError);
    return 0;
  }
}

async function readXlsFile(filePath: string, paymentType: PaymentType): Promise<number> {
  const XLSX = await import('xlsx');
  const fileBuffer = await fs.readFile(filePath);
  const workbook = XLSX.read(fileBuffer, { 
    type: 'buffer',
    cellText: false,
    cellNF: false,
    cellHTML: false,
    raw: true // Dodato raw: true za bolje čitanje numeričkih vrednosti
  });
  
  console.log('✓ Successfully read .xls file with SheetJS');
  console.log('Sheet names:', workbook.SheetNames);

  let sheetIndex: number;
  let targetColumn: string;

  if (paymentType === 'prepaid') {
    console.log('Processing PREPAID - looking at first sheet, column C');
    sheetIndex = 0;
    targetColumn = 'C';
  } else {
    console.log('Processing POSTPAID - looking at last sheet, column N');
    sheetIndex = workbook.SheetNames.length - 1;
    targetColumn = 'N';
  }

  const sheetName = workbook.SheetNames[sheetIndex];
  console.log(`Using sheet: ${sheetName} (index: ${sheetIndex})`);
  
  return extractValueFromSheet(workbook, sheetIndex, targetColumn);
}

async function readXlsxFile(filePath: string, paymentType: PaymentType): Promise<number> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  console.log('✓ Successfully read .xlsx file with ExcelJS');

  if (paymentType === 'prepaid') {
    return extractValueFromExcelJSWorksheet(workbook.getWorksheet(1), 'C');
  } else {
    const lastWorksheetIndex = workbook.worksheets.length;
    return extractValueFromExcelJSWorksheet(workbook.getWorksheet(lastWorksheetIndex), 'N');
  }
}

function extractValueFromSheet(workbook: any, sheetIndex: number, column: string): number {
  const sheetName = workbook.SheetNames[sheetIndex];
  const worksheet = workbook.Sheets[sheetName];
  
  if (!worksheet) {
    console.log('Worksheet not found for index:', sheetIndex);
    return 0;
  }

  console.log('Processing sheet:', sheetName);
  console.log('Looking for column:', column);
  
  // Pokušaj direktno čitanje ćelija iz worksheet objekta
  const columnIndex = column.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
  console.log('Column index:', columnIndex);
  
  // Pronađi poslednju vrednost u koloni direktno iz worksheet objekta
  let lastValue = 0;
  let lastRowFound = 0;
  
  // Iteruj kroz sve ćelije u worksheet objektu
  for (const cellAddress in worksheet) {
    // Preskoči metapodatke (počinju sa !)
    if (cellAddress.startsWith('!')) continue;
    
    // Proveri da li ćelija pripada našoj koloni
    const cellColumn = cellAddress.match(/^([A-Z]+)/)?.[1];
    if (cellColumn === column) {
      const cellValue = worksheet[cellAddress];
      if (cellValue && cellValue.v !== undefined && cellValue.v !== null && cellValue.v !== '') {
        const rowNumber = parseInt(cellAddress.replace(/[A-Z]/g, ''));
        if (rowNumber > lastRowFound) {
          lastRowFound = rowNumber;
          lastValue = typeof cellValue.v === 'number' ? cellValue.v : parseFloat(cellValue.v) || 0;
          console.log(`Found value in ${cellAddress}: ${cellValue.v} (parsed: ${lastValue})`);
        }
      }
    }
  }
  
  if (lastRowFound > 0) {
    console.log(`Last value found in ${column}${lastRowFound}: ${lastValue}`);
    return lastValue;
  }
  
  // Fallback na json metodu ako direktno čitanje ne radi
  console.log('Direct cell reading failed, trying JSON method...');
  
  try {
    const XLSX = require('xlsx') || (global as any).XLSX;
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '', 
      raw: true // Koristimo raw: true za numeričke vrednosti
    }) as any[][];
    
    if (!jsonData || jsonData.length === 0) {
      console.log('No JSON data extracted');
      return 0;
    }
    
    console.log('Total rows from JSON:', jsonData.length);
    console.log('First few rows:', jsonData.slice(0, 3));
    console.log('Last few rows:', jsonData.slice(-3));
    
    // Traži poslednju vrednost u koloni
    for (let i = jsonData.length - 1; i >= 0; i--) {
      const row = jsonData[i];
      if (row && row[columnIndex] !== undefined && row[columnIndex] !== null && row[columnIndex] !== '') {
        const cellValue = row[columnIndex];
        console.log(`JSON: Last value found in row ${i + 1}, column ${column}:`, cellValue);
        return typeof cellValue === 'number' ? cellValue : parseFloat(cellValue) || 0;
      }
    }
  } catch (jsonError) {
    console.error('JSON extraction failed:', jsonError);
  }
  
  console.log('No value found in column', column);
  return 0;
}

function extractValueFromExcelJSWorksheet(worksheet: any, column: string): number {
  if (!worksheet) return 0;

  let lastRow = 1;
  worksheet.eachRow((row: any, rowNumber: number) => {
    const cellValue = row.getCell(column).value;
    if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
      lastRow = rowNumber;
    }
  });

  const lastCell = worksheet.getCell(`${column}${lastRow}`);
  if (lastCell.value) {
    return typeof lastCell.value === 'number' ? lastCell.value : parseFloat(lastCell.value as string) || 0;
  }
  
  return 0;
}

// AŽURIRANA FUNKCIJA - Sada koristi novu funkciju za proveru
async function getOriginalReportValue(
  orgData: OrganizationData,
  month: number,
  year: number,
  paymentType: PaymentType
): Promise<number> {
  try {
    console.log('=== DEBUG getOriginalReportValue ===');
    console.log('Input params:', { orgData: orgData.name, month, year, paymentType });

    const orgFolderName = generateOrganizationFolderName(orgData.shortNumber || 'unknown', orgData.name);
    console.log('Generated folder name:', orgFolderName);
    
    const originalReportPath = path.join(
      ORIGINAL_REPORTS_PATH,
      orgFolderName,
      year.toString(),
      month.toString().padStart(2, '0'),
      paymentType
    );

    console.log(`Looking for original reports in: ${originalReportPath}`);

    let files: string[] = [];
    try {
      files = await fs.readdir(originalReportPath);
      console.log('All files in directory:', files);
    } catch (error) {
      console.log(`❌ Original reports directory not found: ${originalReportPath}`);
      return 0;
    }

    // AŽURIRANO: Koristi novu funkciju koja proverava i datum i tip plaćanja
    let xlsFile = files.find(f => {
      const isExcel = f.toLowerCase().endsWith('.xls') || f.toLowerCase().endsWith('.xlsx');
      if (!isExcel) return false;
      
      const matches = isFileForPeriodAndPaymentType(f, month, year, paymentType);
      if (matches) {
        console.log(`✓ Found matching file for ${paymentType}: ${f}`);
      }
      return matches;
    });

    // Fallback: traži bilo koji Excel fajl koji odgovara tipu plaćanja
    if (!xlsFile) {
      console.log('No file found with matching date and payment type, trying any Excel file for payment type...');
      xlsFile = files.find(f => {
        const isExcel = f.toLowerCase().endsWith('.xls') || f.toLowerCase().endsWith('.xlsx');
        if (!isExcel) return false;
        
        const paymentMatches = isFileForPaymentType(f, paymentType);
        if (paymentMatches) {
          console.log(`Using fallback Excel file for ${paymentType}: ${f}`);
        }
        return paymentMatches;
      });
    }

    // Poslednji fallback: bilo koji Excel fajl
    if (!xlsFile) {
      console.log('No file found for payment type, trying any Excel file...');
      xlsFile = files.find(f => f.toLowerCase().endsWith('.xls') || f.toLowerCase().endsWith('.xlsx'));
      if (xlsFile) {
        console.log(`Using final fallback Excel file: ${xlsFile}`);
      }
    }

    if (!xlsFile) {
      console.log(`❌ No Excel file found in ${originalReportPath} for ${paymentType}`);
      return 0;
    }

    const filePath = path.join(originalReportPath, xlsFile);
    console.log(`Found original report: ${filePath}`);

    return await readExcelValue(filePath, paymentType);
    
  } catch (error) {
    console.error(`❌ Error reading original report for ${orgData.name}:`, error);
    return 0;
  }
}

// ============================================
// EXCEL GENERATION FUNCTIONS
// ============================================

async function generateCompleteReportWithExcelJS(
  org: OrganizationReportData,
  month: number,
  year: number,
  paymentType: PaymentType,
  templateType: TemplateType,
  filePath: string
): Promise<boolean> {
  try {
    let ExcelJS;
    try {
      ExcelJS = await import('exceljs');
    } catch (importError) {
      console.log('ExcelJS not available:', importError);
      return false;
    }

    const masterTemplatePath = getMasterTemplatePath(templateType);
    try {
      await fs.access(masterTemplatePath, fs.constants.R_OK);
    } catch (accessError) {
      console.log('Master template not accessible:', accessError);
      return false;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(masterTemplatePath);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('Worksheet not found');
    }

    const reportValue = await getOriginalReportValue(org, month, year, paymentType);
    console.log(`>>> ${org.name}: reportValue = ${reportValue} (${paymentType})`);

    const counterValue = await GlobalCounterManager.incrementIfValid(
      month, 
      year, 
      reportValue, 
      org.name,
      'complete-reports'
    );
    
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    const dateRange = `${format(monthStart, 'd.MM.yyyy')} do ${format(monthEnd, 'd.MM.yyyy')}`;
    
    // CRITICAL: Call formatContractInfo with logging
    console.log(`Generating contractInfo for ${org.name}...`);
    console.log(`  - Contracts available:`, org.contracts);
    const contractInfo = formatContractInfo(org.contracts);
    console.log(`  - Generated contractInfo: "${contractInfo}"`);

    const updates: CellUpdate[] = [
      ...(counterValue !== null ? [{ cell: 'D18', value: counterValue }] : []),
      { cell: 'E18', value: `/${month.toString().padStart(2, '0')}` },
      { cell: 'A19', value: contractInfo }, // This should now have value
      { cell: 'D21', value: org.name },
      { cell: 'D24', value: reportValue },
      { cell: 'E39', value: dateRange },
      { cell: 'D29', value: `ПИБ ${org.pib || ''}` },
      { cell: 'F29', value: `матични број ${org.registrationNumber || ''}` },
      { cell: 'G40', value: org.shortNumber || '' },
      { cell: 'D38', value: `Наплаћен износ у ${paymentType} саобраћају у периоду` },
      { cell: 'D33', value: org.mission },
      { cell: 'D27', value: `Банка: ${org.bank}  Рачун: ${org.accountNumber}`},
    ];

    // Log what we're writing to A19
    const a19Update = updates.find(u => u.cell === 'A19');
    console.log(`Setting cell A19 to: "${a19Update?.value}" (type: ${typeof a19Update?.value})`);

    updates.forEach(({ cell, value }) => {
      try {
        const cellObj = worksheet.getCell(cell);
        cellObj.value = value;
        
        if (cell === 'A19') {
          console.log(`✓ Successfully set A19 to: "${value}"`);
        }
      } catch (error) {
        console.log(`Could not update cell ${cell}:`, error);
      }
    });

    // Explicit cell setting
    if (counterValue === null) {
      worksheet.getCell('D18').value = null;
      console.log(`${org.name}: D18 ostavljen prazan (reportValue=${reportValue})`);
    } else {
      console.log(`${org.name}: D18 postavljen na ${counterValue} (reportValue=${reportValue})`);
    }

    worksheet.getCell('D24').value = reportValue;

    await workbook.xlsx.writeFile(filePath);
    console.log(`✅ Complete report generated for ${org.name}: ${path.basename(filePath)} (${paymentType})`);
    
    return true;
  } catch (error) {
    console.error(`Error in generateCompleteReportWithExcelJS for ${org.name}:`, error);
    return false;
  }
}

async function generateReportWithFallback(
  org: OrganizationReportData,
  month: number,
  year: number,
  paymentType: PaymentType,
  templateType: TemplateType,
  filePath: string
): Promise<void> {
  try {
    const masterTemplatePath = getMasterTemplatePath(templateType);
    const templateBuffer = await fs.readFile(masterTemplatePath);
    
    const workbook = XLSX.read(templateBuffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const reportValue = await getOriginalReportValue(org, month, year, paymentType);
    console.log(`>>> FALLBACK ${org.name}: reportValue = ${reportValue} (${paymentType})`);

    const counterValue = await GlobalCounterManager.incrementIfValid(
      month,
      year,
      reportValue,
      org.name,
      'complete-reports'
    );

    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    const dateRange = `${format(monthStart, 'd.MM.yyyy')} do ${format(monthEnd, 'd.MM.yyyy')}`;
    
    // CRITICAL: Same improvement
    console.log(`[FALLBACK] Generating contractInfo for ${org.name}...`);
    const contractInfo = formatContractInfo(org.contracts);
    console.log(`[FALLBACK] Generated contractInfo: "${contractInfo}"`);

    const updates: CellUpdate[] = [
      ...(counterValue !== null ? [{ cell: 'D18', value: counterValue }] : []),
      { cell: 'E18', value: `/${month.toString().padStart(2, '0')}` },
      { cell: 'A19', value: contractInfo },
      { cell: 'D21', value: org.name },
      { cell: 'D24', value: reportValue },
      { cell: 'E39', value: dateRange },
      { cell: 'D29', value: `ПИБ ${org.pib || ''}` },
      { cell: 'F29', value: `матични број ${org.registrationNumber || ''}` },
      { cell: 'G40', value: org.shortNumber || '' },
      { cell: 'D38', value: `Наплаћен износ у ${paymentType} саобраћају у периоду` },
      { cell: 'D33', value: org.mission },
      { cell: 'D27', value: `Банка: ${org.bank}  Рачун: ${org.accountNumber}`},
    ];

    updates.forEach(({ cell, value }) => {
      try {
        if (typeof value === 'number') {
          worksheet[cell] = { t: 'n', v: value };
        } else {
          worksheet[cell] = { t: 's', v: value?.toString() || '' };
        }
        
        if (cell === 'A19') {
          console.log(`[FALLBACK] ✓ Set A19 to: "${value}"`);
        }
      } catch (error) {
        console.log(`Could not update cell ${cell}:`, error);
      }
    });

    const sanitizedFilePath = path.join(
      path.dirname(filePath),
      sanitizeFileName(path.basename(filePath))
    );

    const dir = path.dirname(sanitizedFilePath);
    await ensureDirectoryExists(dir);
    await safeFileDelete(sanitizedFilePath);

    XLSX.writeFile(workbook, sanitizedFilePath);
    console.log(`✅ Fallback complete report generated for ${org.name}: ${path.basename(sanitizedFilePath)} (${paymentType})`);

  } catch (error) {
    console.error(`❌ Error generating fallback report for ${org.name}:`, error);
    throw new Error(`Fallback report generation failed for ${org.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================
// MAIN GENERATION FUNCTIONS
// ============================================

async function generateCompleteReportForOrganization(
  org: OrganizationReportData,
  month: number,
  year: number,
  paymentType: PaymentType,
  templateType: TemplateType
): Promise<NonNullable<ReportGenerationResult['generatedFiles']>[0]> {
  try {
    const orgFolderName = generateOrganizationFolderName(org.shortNumber, org.name);
    const orgFolderPath = path.join(
      process.cwd(), 
      'public',
      'reports',
      orgFolderName,
      year.toString(),
      month.toString().padStart(2, '0'),
      paymentType
    );
    
    await ensureDirectoryExists(orgFolderPath);

    const fileName = `complete_report_${sanitizeFileName(org.name)}_${paymentType}_${month.toString().padStart(2, '0')}_${year}.xlsx`;
    const filePath = path.join(orgFolderPath, fileName);

    try {
      const result = await generateCompleteReportWithExcelJS(org, month, year, paymentType, templateType, filePath);
      if (result) {
        return {
          organizationName: org.name,
          fileName,
          status: 'success'
        };
      }
    } catch (error) {
      console.log('ExcelJS failed for complete report, trying fallback method:', error);
    }

    await generateReportWithFallback(org, month, year, paymentType, templateType, filePath);

    return {
      organizationName: org.name,
      fileName,
      status: 'success'
    };
  } catch (error) {
    throw new Error(`Greška za organizaciju ${org.name}: ${error instanceof Error ? error.message : 'Nepoznata greška'}`);
  }
}

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

export async function generateAllHumanitarianReports(
  month: number,
  year: number,
  paymentType: PaymentType,
  templateType: TemplateType = 'telekom'
): Promise<ReportGenerationResult> {
  const generatedFiles: NonNullable<ReportGenerationResult['generatedFiles']> = [];
  const errors: string[] = [];

  try {
    GlobalCounterManager.startNewGeneration();
    console.log(`🔄 Started NEW generation for ${month}/${year} ${paymentType} complete-reports`);

    // Validate input parameters
    if (!month || !year || month < 1 || month > 12) {
      return {
        success: false,
        message: 'Nevalidni parametri: mesec mora biti između 1 i 12',
        processed: 0,
        errors: ['Nevalidni parametri za mesec ili godinu']
      };
    }

    // Validate master template exists
    try {
      await fs.access(getMasterTemplatePath(templateType));
    } catch {
      return {
        success: false,
        message: 'Master template fajl nije pronađen',
        processed: 0,
        errors: [`Master template fajl nije dostupan na putanji: ${getMasterTemplatePath(templateType)}`]
      };
    }

    const organizations = await getOrganizationsWithReportData(month, year, paymentType);

    if (organizations.length === 0) {
      return {
        success: false,
        message: 'Nije pronađena nijedna aktivna humanitarna organizacija sa aktivnim ugovorom',
        processed: 0
      };
    }

    // Consistent ordering by name
    organizations.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`🏢 Processing ${organizations.length} organizations for ${paymentType} reports`);

    // Sequential processing
    for (const org of organizations) {
      try {
        const result = await generateCompleteReportForOrganization(
          org,
          month,
          year,
          paymentType,
          templateType
        );

        generatedFiles.push(result);
      } catch (error) {
        const errorMsg = `Greška za ${org.name}: ${error instanceof Error ? error.message : 'Nepoznata greška'}`;
        errors.push(errorMsg);

        generatedFiles.push({
          organizationName: org.name,
          fileName: '',
          status: 'error',
          message: errorMsg
        });
      }
    }

    const successCount = generatedFiles.filter(f => f.status === 'success').length;

    GlobalCounterManager.finishGeneration();

    return {
      success: successCount > 0,
      message: successCount === organizations.length 
        ? `Uspešno generisano ${successCount} kompletnih ${paymentType} izveštaja`
        : `Uspešno generisano ${successCount} od ${organizations.length} kompletnih ${paymentType} izveštaja`,
      processed: successCount,
      errors: errors.length > 0 ? errors : undefined,
      generatedFiles
    };
  } catch (error) {
    GlobalCounterManager.finishGeneration();
    
    console.error('Error in generateAllHumanitarianReports:', error);
    return {
      success: false,
      message: `Greška pri generisanju kompletnih ${paymentType} izveštaja`,
      processed: 0,
      errors: [error instanceof Error ? error.message : 'Nepoznata greška']
    };
  }
}