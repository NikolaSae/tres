// actions/reports/generate-all-humanitarian-reports.ts - FIXED VERSION WITH SIMPLIFIED COUNTER
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { db } from "@/lib/db";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { generateOrganizationFolderName } from "@/utils/report-path";
import * as XLSX from 'xlsx';

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

type PaymentType = 'prepaid' | 'postpaid';
type TemplateType = 'telekom' | 'globaltel';

const TEMPLATES_PATH = path.join(process.cwd(), 'templates');
const REPORTS_BASE_PATH = path.join(process.cwd(), 'reports');
const ORIGINAL_REPORTS_PATH = path.join(process.cwd(), 'public', 'reports');

// ============================================
// SIMPLIFIED COUNTER SYSTEM - SVAKO GENERISANJE KREIRA NOVI FAJL
// ============================================

/**
 * SIMPLIFIED: Thread-safe counter manager - svako generisanje kreira novi counter fajl
 */
class GlobalCounterManager {
  private static lockFiles = new Map<string, Promise<void>>();
  private static currentCounterPath: string | null = null;

  /**
   * Generiše naziv fajla sa timestamp-om
   */
  private static generateCounterFileName(): string {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .substring(0, 19); // YYYY-MM-DD_HH-MM-SS
    
    return `counter_${timestamp}.json`;
  }

  /**
   * Kreira novi counter fajl za novo generisanje
   */
  private static async createNewCounterFile(
    month: number,
    year: number,
    generationType: 'templates' | 'complete-reports'
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

    const initialData = {
      totalReports: 0,
      validReportsCount: 0,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      month,
      year,
      generationType,
      processedOrganizations: [] as Array<{
        name: string,
        timestamp: string,
        value: number,
        counterAssigned: number | null
      }>
    };

    await fs.writeFile(filePath, JSON.stringify(initialData, null, 2));
    console.log(`✅ Created NEW counter file: ${fileName} for ${generationType}`);
    
    return filePath;
  }

  /**
   * POČETAK novog generisanja - resetuje currentCounterPath
   */
  static startNewGeneration(): void {
    this.currentCounterPath = null;
    console.log('🔄 Started new generation - counter will be created on first increment');
  }

  /**
   * KRAJ generisanja - eksplicitno resetuje currentCounterPath
   */
  static finishGeneration(): void {
    if (this.currentCounterPath) {
      console.log(`✅ Finished generation using: ${path.basename(this.currentCounterPath)}`);
      this.currentCounterPath = null;
    }
  }

  /**
   * Glavna funkcija za increment
   */
  static async incrementIfValid(
    month: number,
    year: number,
    reportValue: number,
    organizationName: string,
    generationType: 'templates' | 'complete-reports' = 'templates'
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
      const result = await lockPromise;
      return result;
    } finally {
      this.lockFiles.delete(lockKey);
    }
  }

  private static async _performIncrement(
    month: number,
    year: number,
    reportValue: number,
    organizationName: string,
    generationType: 'templates' | 'complete-reports'
  ): Promise<number | null> {
    try {
      // Ako je PRVI poziv u ovom generisanju → kreira novi fajl
      if (!this.currentCounterPath) {
        this.currentCounterPath = await this.createNewCounterFile(month, year, generationType);
        console.log(`🆕 NEW GENERATION: Created ${path.basename(this.currentCounterPath)}`);
      }

      // Čitaj trenutni fajl
      const fileContent = await fs.readFile(this.currentCounterPath, 'utf8');
      const counterData = JSON.parse(fileContent);

      counterData.totalReports += 1;
      counterData.validReportsCount += 1;
      const newCounterValue = counterData.validReportsCount;

      // Dodaj organizaciju u log
      counterData.processedOrganizations.push({
        name: organizationName,
        timestamp: new Date().toISOString(),
        value: reportValue,
        counterAssigned: newCounterValue
      });

      counterData.lastUpdated = new Date().toISOString();

      // Atomski upis
      await fs.writeFile(this.currentCounterPath, JSON.stringify(counterData, null, 2));

      console.log(`${organizationName}: Dodeljen counter broj ${newCounterValue} (reportValue=${reportValue}) [${generationType}] -> ${path.basename(this.currentCounterPath)}`);
      return newCounterValue;
    } catch (error) {
      console.error(`Error updating global counter for ${month}/${year}:`, error);
      return null;
    }
  }

  /**
   * Dobija trenutni counter bez increment-a (za read-only operacije)
   */
  static async getCurrentCounter(month: number, year: number): Promise<number> {
    try {
      if (this.currentCounterPath) {
        const fileContent = await fs.readFile(this.currentCounterPath, 'utf8');
        const counterData = JSON.parse(fileContent);
        return counterData.validReportsCount || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }
}

/**
 * Poboljšana funkcija za kreiranje bezbednih imena fajlova
 * Podržava ćirilična slova i bolje rukovanje specijalnim karakterima
 */
function sanitizeFileName(orgName: string, maxLength: number = 50): string {
  if (!orgName || typeof orgName !== 'string') {
    return 'unknown_org';
  }

  let sanitized = orgName
    // Ukloni leading/trailing spaces
    .trim()
    // Zameni multiple spaces sa jednim
    .replace(/\s+/g, ' ')
    // Transliteracija ćiriličnih slova u latinicu
    .replace(/[а]/g, 'a').replace(/[А]/g, 'A')
    .replace(/[б]/g, 'b').replace(/[Б]/g, 'B')
    .replace(/[в]/g, 'v').replace(/[В]/g, 'V')
    .replace(/[г]/g, 'g').replace(/[Г]/g, 'G')
    .replace(/[д]/g, 'd').replace(/[Д]/g, 'D')
    .replace(/[ђ]/g, 'dj').replace(/[Ђ]/g, 'Dj')
    .replace(/[е]/g, 'e').replace(/[Е]/g, 'E')
    .replace(/[ж]/g, 'z').replace(/[Ж]/g, 'Z')
    .replace(/[з]/g, 'z').replace(/[З]/g, 'Z')
    .replace(/[и]/g, 'i').replace(/[И]/g, 'I')
    .replace(/[ј]/g, 'j').replace(/[Ј]/g, 'J')
    .replace(/[к]/g, 'k').replace(/[К]/g, 'K')
    .replace(/[л]/g, 'l').replace(/[Л]/g, 'L')
    .replace(/[љ]/g, 'lj').replace(/[Љ]/g, 'Lj')
    .replace(/[м]/g, 'm').replace(/[М]/g, 'M')
    .replace(/[н]/g, 'n').replace(/[Н]/g, 'N')
    .replace(/[њ]/g, 'nj').replace(/[Њ]/g, 'Nj')
    .replace(/[о]/g, 'o').replace(/[О]/g, 'O')
    .replace(/[п]/g, 'p').replace(/[П]/g, 'P')
    .replace(/[р]/g, 'r').replace(/[Р]/g, 'R')
    .replace(/[с]/g, 's').replace(/[С]/g, 'S')
    .replace(/[т]/g, 't').replace(/[Т]/g, 'T')
    .replace(/[ћ]/g, 'c').replace(/[Ћ]/g, 'C')
    .replace(/[у]/g, 'u').replace(/[У]/g, 'U')
    .replace(/[ф]/g, 'f').replace(/[Ф]/g, 'F')
    .replace(/[х]/g, 'h').replace(/[Х]/g, 'H')
    .replace(/[ц]/g, 'c').replace(/[Ц]/g, 'C')
    .replace(/[ч]/g, 'c').replace(/[Ч]/g, 'C')
    .replace(/[џ]/g, 'dz').replace(/[Џ]/g, 'Dz')
    .replace(/[ш]/g, 's').replace(/[Ш]/g, 'S')
    // Zameni spaces sa underscores
    .replace(/\s/g, '_')
    // Ukloni ili zameni problematične karaktere za fajl sistem
    .replace(/[<>:"/\\|?*]/g, '') // Windows problematični karakteri
    .replace(/[„"""'']/g, '') // Različiti quote karakteri
    .replace(/[–—]/g, '-') // En-dash, em-dash → hyphen
    .replace(/[•]/g, '_') // Bullet point
    .replace(/[…]/g, '') // Ellipsis
    // Zameni ostale specijalne karaktere sa underscores, ali zadrži alphanumeric i basic punctuation
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    // Ukloni multiple underscores
    .replace(/_+/g, '_')
    // Ukloni leading/trailing underscores
    .replace(/^_+|_+$/g, '');

  // Ograniči dužinu
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).replace(/_+$/, '');
  }

  // Fallback ako je ime prazno nakon sanitizacije
  if (!sanitized) {
    sanitized = 'org';
  }

  return sanitized;
}

// Get master template path based on type
function getMasterTemplatePath(templateType: TemplateType): string {
  return path.join(TEMPLATES_PATH, `humanitarian-template-${templateType}.xlsx`);
}

function extractDatesFromFileName(fileName: string) {
  console.log('Parsing filename:', fileName);
  
  const datePattern = /__(\d{8}_\d{4})__(\d{8}_\d{4})\./;
  const match = fileName.match(datePattern);
  
  if (match) {
    const startDateStr = match[1];
    const endDateStr = match[2];
    
    console.log('Found date strings:', { startDateStr, endDateStr });
    
    const startYear = parseInt(startDateStr.substr(0, 4));
    const startMonth = parseInt(startDateStr.substr(4, 2));
    const startDay = parseInt(startDateStr.substr(6, 2));
    const startHour = parseInt(startDateStr.substr(9, 2));
    const startMin = parseInt(startDateStr.substr(11, 2));
    
    const endYear = parseInt(endDateStr.substr(0, 4));
    const endMonth = parseInt(endDateStr.substr(4, 2));
    const endDay = parseInt(endDateStr.substr(6, 2));
    const endHour = parseInt(endDateStr.substr(9, 2));
    const endMin = parseInt(endDateStr.substr(11, 2));
    
    const startDate = new Date(startYear, startMonth - 1, startDay, startHour, startMin);
    const endDate = new Date(endYear, endMonth - 1, endDay, endHour, endMin);
    
    console.log('Parsed dates:', { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(),
      month: startMonth,
      year: startYear
    });
    
    return {
      startDate,
      endDate,
      month: startMonth,
      year: startYear,
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

function isFileForPeriod(fileName: string, targetMonth: number, targetYear: number) {
  const dates = extractDatesFromFileName(fileName);
  
  if (!dates.isValid) {
    console.log(`File ${fileName} - datumi nisu validni`);
    return false;
  }
  
  const fileMatches = dates.month === targetMonth && dates.year === targetYear;
  console.log(`File ${fileName} - matches period ${targetMonth}/${targetYear}:`, fileMatches);
  
  return fileMatches;
}

export async function generateAllHumanitarianReports(
  month: number,
  year: number,
  paymentType: PaymentType,
  templateType: TemplateType = 'telekom'
): Promise<ReportGenerationResult> {
  const generatedFiles: NonNullable<ReportGenerationResult['generatedFiles']> = [];
  const errors: string[] = [];

  try {
    // 🔄 POČETAK novog generisanja
    GlobalCounterManager.startNewGeneration();
    console.log(`🔄 Started NEW generation for ${month}/${year} complete-reports`);

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

    // Get all active humanitarian organizations with their data
    const organizations = await getOrganizationsWithReportData(month, year, paymentType);

    if (organizations.length === 0) {
      return {
        success: false,
        message: 'Nije pronađena nijedna aktivna humanitarna organizacija sa aktivnim ugovorom',
        processed: 0
      };
    }

    // KLJUČNO: Sortiranje organizacija po imenu za konzistentan redosled
    organizations.sort((a, b) => a.name.localeCompare(b.name));

    // SEKVENCIJALNO procesiranje organizacija
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

    // 🏁 KRAJ generisanja
    GlobalCounterManager.finishGeneration();

    return {
      success: successCount > 0,
      message: successCount === organizations.length 
        ? `Uspešno generisano ${successCount} kompletnih izveštaja`
        : `Uspešno generisano ${successCount} od ${organizations.length} kompletnih izveštaja`,
      processed: successCount,
      errors: errors.length > 0 ? errors : undefined,
      generatedFiles
    };
  } catch (error) {
    // 🏁 KRAJ generisanja čak i pri grešci
    GlobalCounterManager.finishGeneration();
    
    console.error('Error in generateAllHumanitarianReports:', error);
    return {
      success: false,
      message: 'Greška pri generisanju kompletnih izveštaja',
      processed: 0,
      errors: [error instanceof Error ? error.message : 'Nepoznata greška']
    };
  }
}

async function getOrganizationsWithReportData(
  month: number,
  year: number,
  paymentType: PaymentType
): Promise<OrganizationReportData[]> {
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
      contracts: {
        where: {
          status: 'ACTIVE',
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        },
        select: {
          name: true,
          contractNumber: true,
          startDate: true,
        },
        take: 1
      }
    }
  });

  // Enhance with report-specific data
  const enhancedOrganizations: OrganizationReportData[] = [];

  for (const org of organizations) {
    const monthlyData = await getMonthlyDataForOrganization(org.id, org.shortNumber || '', month, year, paymentType);

    enhancedOrganizations.push({
      ...org,
      monthlyRevenue: monthlyData.revenue,
      totalTransactions: monthlyData.transactions,
      serviceUsage: monthlyData.serviceUsage
    });
  }

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
    // Check if the vas_transactions table exists before querying
    // If the table doesn't exist, return default values
    return {
      revenue: 0,
      transactions: 0,
      serviceUsage: { postpaid: 0, prepaid: 0 }
    };
    
    // If you have a different table for transactions, replace the query below:
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

    const serviceUsage = {
      [paymentType]: transactionCount
    };

    return {
      revenue,
      transactions: transactionCount,
      serviceUsage
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

async function generateCompleteReportForOrganization(
  org: OrganizationReportData,
  month: number,
  year: number,
  paymentType: PaymentType,
  templateType: TemplateType
): Promise<NonNullable<ReportGenerationResult['generatedFiles']>[0]> {
  try {
    // Use the correct public/reports/ path structure with organization folder name AND paymentType
    const orgFolderName = generateOrganizationFolderName(org.shortNumber, org.name);
    const orgFolderPath = path.join(
      process.cwd(), 
      'public',
      'reports',
      orgFolderName,
      year.toString(),
      month.toString().padStart(2, '0'),
      paymentType  // Add paymentType to the path
    );
    
    await fs.mkdir(orgFolderPath, { recursive: true });

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

    // Fallback method if ExcelJS fails
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
    console.log(`>>> ${org.name}: reportValue = ${reportValue}`);

    // SIMPLIFIED COUNTER - koristi complete-reports tip
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

    let contractInfo = '';
if (org.contracts && org.contracts.length > 0) {
  const activeContract = org.contracts[0];
  const startDate = activeContract.startDate ? new Date(activeContract.startDate) : null;
  if (activeContract.name && startDate) {
    contractInfo = `Уговор бр ${activeContract.name} од ${format(startDate, 'dd.MM.yyyy')}`;
  } else if (activeContract.name) {
    contractInfo = `Уговор бр ${activeContract.name}`;
  }
}


    const updates = [
      // Counter se postavlja SAMO ako ima vrednost
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
      { cell: 'F24', value: org.monthlyRevenue || 0 },
      { cell: 'G24', value: org.totalTransactions || 0 },
      ...(org.serviceUsage ? [
        { cell: 'H24', value: paymentType === 'postpaid' ? (org.serviceUsage.postpaid || 0) : (org.serviceUsage.prepaid || 0) }
      ] : [])
    ];

    updates.forEach(({ cell, value }) => {
      try {
        const cellObj = worksheet.getCell(cell);
        cellObj.value = value;
      } catch (error) {
        console.log(`Could not update cell ${cell}:`, error);
      }
    });

    // Eksplicitno postavljanje D18 i D24
    if (counterValue === null) {
      worksheet.getCell('D18').value = null;
      console.log(`${org.name}: D18 ostavljen prazan (reportValue=${reportValue})`);
    } else {
      console.log(`${org.name}: D18 postavljen na ${counterValue} (reportValue=${reportValue})`);
    }

    worksheet.getCell('D24').value = reportValue;

    await workbook.xlsx.writeFile(filePath);
    console.log(`✅ Complete report generated for ${org.name}: ${path.basename(filePath)}`);
    
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
    console.log(`>>> FALLBACK ${org.name}: reportValue = ${reportValue}`);

    // SIMPLIFIED COUNTER - koristi complete-reports tip
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

    let contractInfo = '';
if (org.contracts && org.contracts.length > 0) {
  const activeContract = org.contracts[0];
  const startDate = activeContract.startDate ? new Date(activeContract.startDate) : null;
  if (activeContract.name && startDate) {
    contractInfo = `Уговор бр ${activeContract.name} од ${format(startDate, 'dd.MM.yyyy')}`;
  } else if (activeContract.name) {
    contractInfo = `Уговор бр ${activeContract.name}`;
  }
}


    // Ažuriranje ćelija u worksheet-u
    const updates: { cell: string; value: any }[] = [
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
      { cell: 'F24', value: org.monthlyRevenue || 0 },
      { cell: 'G24', value: org.totalTransactions || 0 },
      ...(org.serviceUsage ? [
        { cell: 'H24', value: paymentType === 'postpaid' ? (org.serviceUsage.postpaid || 0) : (org.serviceUsage.prepaid || 0) }
      ] : [])
    ];

    // Apply updates to worksheet
    updates.forEach(({ cell, value }) => {
  try {
    if (typeof value === 'number') {
      worksheet[cell] = { t: 'n', v: value }; // broj
    } else {
      worksheet[cell] = { t: 's', v: value?.toString() || '' }; // string
    }
  } catch (error) {
    console.log(`Could not update cell ${cell}:`, error);
  }
});

    // Sačuvaj fajl
    XLSX.writeFile(workbook, filePath);
    console.log(`✅ Fallback complete report generated for ${org.name}: ${path.basename(filePath)}`);
    
  } catch (error) {
    console.error(`❌ Error generating fallback report for ${org.name}:`, error);
    throw new Error(`Fallback report generation failed for ${org.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

      
// Reading original report to get D24 value - IDENTIČNA FUNKCIJA KAO U PRVOM FAJLU
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

    // Prvo pokušaj da nađeš fajl sa datumom u imenu
    let xlsFile = files.find(f => {
      const isExcel = f.toLowerCase().endsWith('.xls') || f.toLowerCase().endsWith('.xlsx');
      if (!isExcel) return false;
      
      const matches = isFileForPeriod(f, month, year);
      if (matches) {
        console.log(`✓ Found matching file: ${f}`);
      }
      return matches;
    });

    // Ako nema fajl sa datumom, uzmi bilo koji Excel fajl
    if (!xlsFile) {
      console.log('No file found with matching date, trying any Excel file...');
      xlsFile = files.find(f => f.toLowerCase().endsWith('.xls') || f.toLowerCase().endsWith('.xlsx'));
      if (xlsFile) {
        console.log(`Using fallback Excel file: ${xlsFile}`);
      }
    }

    if (!xlsFile) {
      console.log(`❌ No Excel file found in ${originalReportPath}`);
      return 0;
    }

    const filePath = path.join(originalReportPath, xlsFile);
    console.log(`Found original report: ${filePath}`);

    // Try to read the file
    try {
      let workbook;
      
      // Check if it's .xls or .xlsx
      if (xlsFile.toLowerCase().endsWith('.xls')) {
        console.log('Reading .xls file with SheetJS...');
        
        // Use SheetJS for .xls files
        const XLSX = await import('xlsx');
        const fileBuffer = await fs.readFile(filePath);
        workbook = XLSX.read(fileBuffer, { 
          type: 'buffer',
          cellText: false,
          cellNF: false,
          cellHTML: false 
        });
        console.log('✓ Successfully read .xls file with SheetJS');
        console.log('Sheet names:', workbook.SheetNames);

        let value = 0;

        if (paymentType === 'prepaid') {
          console.log('Processing PREPAID - looking at first sheet, column C');
          
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          if (worksheet) {
            console.log('Processing sheet:', firstSheetName);
            
            // Convert to JSON to find last value in column C
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1, 
              defval: '', 
              raw: false 
            });
            
            console.log('Total rows:', jsonData.length);
            
            // Find last non-empty value in column C (index 2)
            for (let i = jsonData.length - 1; i >= 0; i--) {
              const row = jsonData[i] as any[];
              if (row && row[2] !== undefined && row[2] !== null && row[2] !== '') {
                console.log(`Last value found in row ${i + 1}, column C:`, row[2]);
                value = typeof row[2] === 'number' ? row[2] : parseFloat(row[2]) || 0;
                break;
              }
            }
          }
        } else {
          console.log('Processing POSTPAID - looking at last sheet, column N');
          
          const lastSheetName = workbook.SheetNames[workbook.SheetNames.length - 1];
          const worksheet = workbook.Sheets[lastSheetName];
          
          if (worksheet) {
            console.log('Processing sheet:', lastSheetName);
            
            // Convert to JSON to find last value in column N
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1, 
              defval: '', 
              raw: false 
            });
            
            console.log('Total rows:', jsonData.length);
            
            // Find last non-empty value in column N (index 13)
            for (let i = jsonData.length - 1; i >= 0; i--) {
              const row = jsonData[i] as any[];
              if (row && row[13] !== undefined && row[13] !== null && row[13] !== '') {
                console.log(`Last value found in row ${i + 1}, column N:`, row[13]);
                value = typeof row[13] === 'number' ? row[13] : parseFloat(row[13]) || 0;
                break;
              }
            }
          }
        }

        console.log(`Final extracted value: ${value}`);
        return value;

      } else {
        console.log('Reading .xlsx file with ExcelJS...');
        
        // Use ExcelJS for .xlsx files
        const ExcelJS = await import('exceljs');
        workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        console.log('✓ Successfully read .xlsx file with ExcelJS');

        let value = 0;

        if (paymentType === 'prepaid') {
          console.log('Processing PREPAID - looking at first worksheet, column C');
          const worksheet = workbook.getWorksheet(1);
          
          if (worksheet) {
            let lastRow = 1;
            worksheet.eachRow((row, rowNumber) => {
              const cellValue = row.getCell('C').value;
              if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
                lastRow = rowNumber;
              }
            });

            const lastCell = worksheet.getCell(`C${lastRow}`);
            if (lastCell.value) {
              value = typeof lastCell.value === 'number' ? lastCell.value : parseFloat(lastCell.value as string) || 0;
            }
          }
        } else {
          console.log('Processing POSTPAID - looking at last worksheet, column N');
          const lastWorksheetIndex = workbook.worksheets.length;
          const worksheet = workbook.getWorksheet(lastWorksheetIndex);
          
          if (worksheet) {
            let lastRow = 1;
            worksheet.eachRow((row, rowNumber) => {
              const cellValue = row.getCell('N').value;
              if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
                lastRow = rowNumber;
              }
            });

            const lastCell = worksheet.getCell(`N${lastRow}`);
            if (lastCell.value) {
              value = typeof lastCell.value === 'number' ? lastCell.value : parseFloat(lastCell.value as string) || 0;
            }
          }
        }

        console.log(`Final extracted value: ${value}`);
        return value;
      }

    } catch (readError) {
      console.log('❌ Failed to read Excel file:', readError);
      return 0;
    }
    
  } catch (error) {
    console.error(`❌ Error reading original report for ${orgData.name}:`, error);
    return 0;
  }
}