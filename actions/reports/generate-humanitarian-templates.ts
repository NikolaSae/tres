// actions/reports/generate-humanitarian-templates.ts
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

// Reading original report to get D24 value
async function getOriginalReportValue(
  orgData: OrganizationData,
  month: number,
  year: number,
  paymentType: PaymentType
): Promise<number> {
  try {

    const orgFolderName = generateOrganizationFolderName(orgData.shortNumber || 'unknown', orgData.name);
    
    const originalReportPath = path.join(
      ORIGINAL_REPORTS_PATH,
      orgFolderName,
      year.toString(),
      month.toString().padStart(2, '0'),
      paymentType
    );

    console.log(`Looking for original reports in: ${originalReportPath}`);

    // Find .xls file in directory
    let files: string[] = [];
    try {
      files = await fs.readdir(originalReportPath);
    } catch (error) {
      console.log(`Original reports directory not found: ${originalReportPath}`);
      return 0;
    }

    const xlsFile = files.find(f => f.toLowerCase().endsWith('.xls'));
    if (!xlsFile) {
      console.log(`No .xls file found in ${originalReportPath}`);
      return 0;
    }

    const filePath = path.join(originalReportPath, xlsFile);
    console.log(`Found original report: ${filePath}`);

    // Try to read with ExcelJS
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      let value = 0;

      if (paymentType === 'prepaid') {
        // First sheet, last value in column C
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
        // Postpaid: last sheet, last value in column N
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

      console.log(`Extracted value from original report: ${value}`);
      return value;

    } catch (excelError) {
      console.log('ExcelJS failed to read .xls file, returning 0:', excelError);
      return 0;
    }
  } catch (error) {
    console.error(`Error reading original report for ${orgData.name}:`, error);
    return 0;
  }
}

// Count only reports with value > 0
async function getCurrentMonthCounter(orgId: string, month: number, year: number): Promise<number> {
  try {
    const counterFilePath = path.join(
      REPORTS_BASE_PATH,
      orgId,
      year.toString(),
      month.toString().padStart(2, '0'),
      'counter.json'
    );

    try {
      const counterData = await fs.readFile(counterFilePath, 'utf8');
      const parsed = JSON.parse(counterData);
      return parsed.validReportsCount || 0;
    } catch (error) {
      return 0;
    }
  } catch (error) {
    console.error(`Error getting counter for ${orgId}:`, error);
    return 0;
  }
}

// Update counter with check if value > 0
async function updateMonthCounter(
  orgId: string, 
  month: number, 
  year: number, 
  reportValue: number
): Promise<number> {
  try {
    const counterFolderPath = path.join(
      REPORTS_BASE_PATH,
      orgId,
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
      year
    };

    try {
      const existingData = await fs.readFile(counterFilePath, 'utf8');
      counterData = { ...counterData, ...JSON.parse(existingData) };
    } catch (error) {
      // file doesn't exist
    }

    counterData.totalReports += 1;
    if (reportValue > 0) {
      counterData.validReportsCount += 1;
    }
    counterData.lastUpdated = new Date().toISOString();

    await fs.writeFile(counterFilePath, JSON.stringify(counterData, null, 2));

    return counterData.validReportsCount;
  } catch (error) {
    console.error(`Error updating counter for ${orgId}:`, error);
    return 1;
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
    const currentCounter = await getCurrentMonthCounter(org.id, month, year);
    const nextCounter = reportValue > 0 ? currentCounter + 1 : currentCounter;

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
      nextCounter
    );

    if (success) {
      await updateMonthCounter(org.id, month, year, reportValue);

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
  counterValue: number
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

    const updates = [
      { cell: 'D18', value: counterValue },
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

    updates.forEach(({ cell, value }) => {
      try {
        const cellObj = worksheet.getCell(cell);
        cellObj.value = value;
      } catch (error) {
        console.log(`Could not update cell ${cell}:`, error);
      }
    });

    await workbook.xlsx.writeFile(filePath);

    return true;
  } catch (error) {
    console.error('ExcelJS method failed:', error);
    return false;
  }
}