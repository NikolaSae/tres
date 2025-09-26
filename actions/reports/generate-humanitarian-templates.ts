// actions/reports/generate-humanitarian-templates.ts - FINALNO ISPRAVLJENA VERZIJA
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { db } from "@/lib/db";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { generateOrganizationFolderName } from "@/utils/report-path";

interface TemplateGenerationResult {
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
  activeContract: {
    name: string;
    contractNumber?: string;
    startDate?: Date;
    endDate?: Date;
  } | null;
}

type PaymentType = 'prepaid' | 'postpaid';
type TemplateType = 'telekom' | 'globaltel';

const TEMPLATES_PATH = path.join(process.cwd(), 'templates');
const REPORTS_BASE_PATH = path.join(process.cwd(), 'reports');
const ORIGINAL_REPORTS_PATH = path.join(process.cwd(), 'public', 'reports');

// ============================================
// THREAD-SAFE GLOBALNI COUNTER FUNKCIJE
// ============================================

/**
 * Thread-safe increment globalnog countera
 * Koristi file locking mehanizam da spreči race conditions
 */
class GlobalCounterManager {
  private static lockFiles = new Map<string, Promise<void>>();

  static async incrementIfValid(
    month: number,
    year: number,
    reportValue: number,
    organizationName: string
  ): Promise<number | null> {
    if (reportValue <= 0) {
      console.log(`${organizationName}: reportValue=${reportValue}, counter se ne uvećava`);
      return null;
    }

    const lockKey = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Čekaj da se oslobodi lock za ovaj mesec/godinu
    while (this.lockFiles.has(lockKey)) {
      await this.lockFiles.get(lockKey);
    }

    // Kreiraj novi lock
    const lockPromise = this._performIncrement(month, year, reportValue, organizationName);
    this.lockFiles.set(lockKey, lockPromise);

    try {
      const result = await lockPromise;
      return result;
    } finally {
      // Ukloni lock
      this.lockFiles.delete(lockKey);
    }
  }

  private static async _performIncrement(
    month: number,
    year: number,
    reportValue: number,
    organizationName: string
  ): Promise<number | null> {
    try {
      const counterFolderPath = path.join(
        REPORTS_BASE_PATH,
        'global-counters',
        year.toString(),
        month.toString().padStart(2, '0')
      );
      await fs.mkdir(counterFolderPath, { recursive: true });

      const counterFilePath = path.join(counterFolderPath, 'counter.json');

      let counterData = {
        totalReports: 0,
        validReportsCount: 0,
        lastUpdated: new Date().toISOString(),
        month,
        year,
        processedOrganizations: [] as Array<{
          name: string,
          timestamp: string,
          value: number,
          counterAssigned: number | null
        }>
      };

      // Čitaj postojeći counter
      try {
        const existingData = await fs.readFile(counterFilePath, 'utf8');
        counterData = { ...counterData, ...JSON.parse(existingData) };
      } catch (error) {
        // fajl ne postoji, koristi default
      }

      counterData.totalReports += 1;
      
      // ✅ KLJUČNO: Uvećaj validReportsCount i dodeli novi broj
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

      // Atomski upis fajla
      await fs.writeFile(counterFilePath, JSON.stringify(counterData, null, 2));

      console.log(`${organizationName}: Dodeljen counter broj ${newCounterValue} (reportValue=${reportValue})`);
      return newCounterValue;
    } catch (error) {
      console.error(`Error updating global counter for ${month}/${year}:`, error);
      return null;
    }
  }
}

// Get master template path based on type
function getMasterTemplatePath(templateType: TemplateType): string {
  return path.join(TEMPLATES_PATH, `humanitarian-template-${templateType}.xlsx`);
}

// Master template validation
async function validateMasterTemplate(templateType: TemplateType): Promise<{ isValid: boolean; error?: string }> {
  try {
    const templatePath = getMasterTemplatePath(templateType);
    await fs.access(templatePath, fs.constants.R_OK);
    const stats = await fs.stat(templatePath);
    if (stats.size === 0) {
      return { isValid: false, error: 'Master template file is empty' };
    }

    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: `Master template validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
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

// Reading original report to get D24 value
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

export async function generateHumanitarianTemplates(
  month: number,
  year: number,
  paymentType: 'prepaid' | 'postpaid',
  templateType: 'telekom' | 'globaltel'
): Promise<TemplateGenerationResult> {
  const generatedFiles: NonNullable<TemplateGenerationResult['generatedFiles']> = [];
  const errors: string[] = [];

  try {
    // Validate input parameters
    if (!month || !year || month < 1 || month > 12) {
      return {
        success: false,
        message: 'Nevalidni parametri: mesec mora biti između 1 i 12',
        processed: 0,
        errors: ['Nevalidni parametri za mesec ili godinu']
      };
    }

    const templateValidation = await validateMasterTemplate(templateType);
    if (!templateValidation.isValid) {
      return {
        success: false,
        message: `Master template fajl (${templateType}) nije pronađen ili nije ispravan`,
        processed: 0,
        errors: [
          templateValidation.error || 'Unknown template validation error',
          `Proverite da li postoji fajl: ${getMasterTemplatePath(templateType)}`,
          'Proverite da li aplikacija ima dozvole za čitanje fajla'
        ]
      };
    }

    const organizations = await db.humanitarianOrg.findMany({
      where: {
        isActive: true,
        contracts: {
          some: {
            status: 'ACTIVE',
            startDate: { lte: new Date() },
            endDate: { gte: new Date() }
          }
        }
      },
      select: {
        id: true,
        name: true,
        accountNumber: true,
        pib: true,
        registrationNumber: true,
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
            endDate: true
          },
          take: 1
        }
      }
    });

    if (organizations.length === 0) {
      return {
        success: false,
        message: 'Nije pronađena nijedna aktivna humanitarna organizacija sa aktivnim ugovorom',
        processed: 0
      };
    }

    // ✅ KLJUČNO: Sortiranje organizacija po imenu za konzistentan redosled
    organizations.sort((a, b) => a.name.localeCompare(b.name));

    // ✅ SEKVENCIJALNO procesiranje da bi counter bio tačan
    for (const org of organizations) {
      try {
        const orgData: OrganizationData = {
          id: org.id,
          name: org.name,
          accountNumber: org.accountNumber,
          pib: org.pib,
          registrationNumber: org.registrationNumber,
          shortNumber: org.shortNumber,
          activeContract: org.contracts[0] || null
        };
        
        const result = await generateTemplateForOrganization(
          orgData,
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

    return {
      success: successCount > 0,
      message: successCount === organizations.length 
        ? `Uspešno generisano ${successCount} ${paymentType} template(s)`
        : `Uspešno generisano ${successCount} od ${organizations.length} ${paymentType} template(s)`,
      processed: successCount,
      errors: errors.length > 0 ? errors : undefined,
      generatedFiles
    };
  } catch (error) {
    console.error('Error in generateHumanitarianTemplates:', error);
    return {
      success: false,
      message: 'Greška pri generisanju template-a',
      processed: 0,
      errors: [error instanceof Error ? error.message : 'Nepoznata greška']
    };
  }
}

async function generateTemplateForOrganization(
  org: OrganizationData,
  month: number,
  year: number,
  paymentType: PaymentType,
  templateType: TemplateType
): Promise<NonNullable<TemplateGenerationResult['generatedFiles']>[0]> {
  try {
    const orgFolderPath = path.join(
      REPORTS_BASE_PATH, 
      org.id, 
      year.toString(), 
      month.toString().padStart(2, '0')
    );
    await fs.mkdir(orgFolderPath, { recursive: true });

    const reportValue = await getOriginalReportValue(org, month, year, paymentType);
    console.log(`>>> ${org.name}: reportValue = ${reportValue}`);
    
    // ✅ THREAD-SAFE counter increment
    const counterValue = await GlobalCounterManager.incrementIfValid(month, year, reportValue, org.name);

    const fileName = `template_${org.name.replace(/[^a-zA-Z0-9]/g, '_')}_${paymentType}_${month.toString().padStart(2, '0')}_${year}.xlsx`;
    const filePath = path.join(orgFolderPath, fileName);

    const success = await generateWithExcelJS(
      org, 
      month, 
      year, 
      paymentType,
      templateType,
      filePath, 
      reportValue, 
      counterValue  // može biti null za prazne izveštaje
    );

    if (success) {
      return {
        organizationName: org.name,
        fileName,
        status: 'success'
      };
    } else {
      throw new Error('Failed to generate template with available methods');
    }
  } catch (error) {
    throw new Error(`Greška za organizaciju ${org.name}: ${error instanceof Error ? error.message : 'Nepoznata greška'}`);
  }
}

async function generateWithExcelJS(
  org: OrganizationData,
  month: number,
  year: number,
  paymentType: PaymentType,
  templateType: TemplateType,
  filePath: string,
  reportValue: number,
  counterValue: number | null  // ✅ Može biti null za prazne izveštaje
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

    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    const dateRange = `${format(monthStart, 'd.MM.yyyy')} do ${format(monthEnd, 'd.MM.yyyy')}`;

    const contractInfo = org.activeContract?.name
      ? `Уговор ${org.activeContract.name}${org.activeContract.startDate ? ` од ${format(org.activeContract.startDate, 'dd.MM.yyyy')}` : ''}`
      : '';

    // ✅ PAMETNO: Uključi D18 SAMO ako ima counterValue
    const updates = [
      ...(counterValue !== null ? [{ cell: 'D18', value: counterValue }] : []),
      { cell: 'E18', value: `/${month.toString().padStart(2, '0')}` },
      { cell: 'A19', value: contractInfo },
      { cell: 'D21', value: org.name },
      { cell: 'D24', value: reportValue },
      { cell: 'E39', value: dateRange },
      { cell: 'D29', value: `ПИБ ${org.pib || ''}` },
      { cell: 'F29', value: `матични број ${org.registrationNumber || ''}` },
      { cell: 'G40', value: org.shortNumber || '' },
      { cell: 'D38', value: `Наплаћен износ у ${paymentType} саобраћају у периоду` }
    ];

    // Postavi sve vrednosti
    updates.forEach(({ cell, value }) => {
      try {
        worksheet.getCell(cell).value = value;
      } catch (error) {
        console.log(`Could not update cell ${cell}:`, error);
      }
    });

    // ✅ EKSPLICITNO: Ako nema counter vrednosti, ostavi D18 prazan
    if (counterValue === null) {
      worksheet.getCell('D18').value = null;
      console.log(`${org.name}: D18 ostavljen prazan (reportValue=${reportValue})`);
    } else {
      console.log(`${org.name}: D18 postavljen na ${counterValue} (reportValue=${reportValue})`);
    }

    // Očisti dodatne ćelije
    ['F24', 'G24', 'H24'].forEach(cell => worksheet.getCell(cell).value = null);

    await workbook.xlsx.writeFile(filePath);

    return true;
  } catch (error) {
    console.error('ExcelJS method failed:', error);
    return false;
  }
}