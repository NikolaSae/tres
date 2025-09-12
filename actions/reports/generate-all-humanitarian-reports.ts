// actions/reports/generate-all-humanitarian-reports.ts
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { db } from "@/lib/db";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { generateOrganizationFolderName, generateReportPath } from "@/utils/report-path";

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

// Get master template path based on type
function getMasterTemplatePath(templateType: TemplateType): string {
  return path.join(TEMPLATES_PATH, `humanitarian-template-${templateType}.xlsx`);
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

    // Process each organization
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
    // Use the correct function to generate report path
    const orgReportPath = generateReportPath(org.id, org.name, new Date(year, month - 1), paymentType);
    const orgFolderPath = path.join(process.cwd(), 'public', orgReportPath);
    await fs.mkdir(orgFolderPath, { recursive: true });

    const fileName = `report_${org.name.replace(/[^a-zA-Z0-9]/g, '_')}_${month.toString().padStart(2, '0')}_${year}.xlsx`;
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

    const currentCounter = await getCurrentMonthCounter(org.id, month, year);
    const nextCounter = reportValue > 0 ? currentCounter + 1 : currentCounter;

    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    const dateRange = `${format(monthStart, 'd.MM.yyyy')} do ${format(monthEnd, 'd.MM.yyyy')}`;

    const activeContract = org.contracts && org.contracts.length > 0 ? org.contracts[0] : null;
    const contractInfo = activeContract?.contractNumber && activeContract?.startDate
      ? `Уговор бр ${activeContract.contractNumber} од ${format(activeContract.startDate, 'dd.MM.yyyy')}`
      : '';

    const updates = [
      { cell: 'D18', value: nextCounter },
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

    await workbook.xlsx.writeFile(filePath);
    await updateMonthCounter(org.id, month, year, reportValue);

    return true;
  } catch (error) {
    console.error('ExcelJS method failed for complete report:', error);
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
  await fs.copyFile(getMasterTemplatePath(templateType), filePath);

  const reportValue = await getOriginalReportValue(org, month, year, paymentType);
  const currentCounter = await getCurrentMonthCounter(org.id, month, year);
  const nextCounter = reportValue > 0 ? currentCounter + 1 : currentCounter;

  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));
  const dateRange = `${format(monthStart, 'd.MM.yyyy')} do ${format(monthEnd, 'd.MM.yyyy')}`;

  const activeContract = org.contracts && org.contracts.length > 0 ? org.contracts[0] : null;
  const contractInfo = activeContract?.contractNumber && activeContract?.startDate
    ? `Уговор бр ${activeContract.contractNumber} од ${format(activeContract.startDate, 'dd.MM.yyyy')}`
    : '';

  const completeReportData = {
    D18: nextCounter,
    E18: `/${month.toString().padStart(2, '0')}`,
    A19: contractInfo,
    D21: org.name,
    D24: reportValue,
    E39: dateRange,
    D29: `ПИБ ${org.pib || ''}`,
    F29: `матични број ${org.registrationNumber || ''}`,
    G40: org.shortNumber || '',
    D38: `Наплаћен iznos u ${paymentType} saobraćaju u periodu`,
    monthlyRevenue: org.monthlyRevenue || 0,
    totalTransactions: org.totalTransactions || 0,
    serviceUsage: org.serviceUsage || { postpaid: 0, prepaid: 0 },
    _metadata: {
      organization: org.name,
      month: month,
      year: year,
      paymentType: paymentType,
      reportType: 'complete',
      generatedAt: new Date().toISOString(),
      note: 'Ove vrednosti treba uneti u odgovarajuće ćelije Excel fajla. Ovaj fajl sadrži kompletne podatke za izveštaj.'
    }
  };

  const dataFilePath = path.join(path.dirname(filePath), 'complete_report_data.json');
  await fs.writeFile(dataFilePath, JSON.stringify(completeReportData, null, 2));

  await updateMonthCounter(org.id, month, year, reportValue);
}

async function getOriginalReportValue(
  org: OrganizationReportData,
  month: number,
  year: number,
  paymentType: PaymentType
): Promise<number> {
  try {
    const orgFolderName = generateOrganizationFolderName(org.shortNumber || 'unknown', org.name);
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

    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();

      await workbook.xlsx.readFile(filePath);

      let value = 0;

      if (paymentType === 'prepaid') {
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
    console.error(`Error reading original report for ${org.name}:`, error);
    return 0;
  }
}

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

    let currentCount = 0;
    try {
      const counterData = await fs.readFile(counterFilePath, 'utf8');
      const parsed = JSON.parse(counterData);
      currentCount = parsed.validReportsCount || 0;
    } catch (error) {
      currentCount = 0;
    }

    if (reportValue > 0) {
      currentCount += 1;
    }

    await fs.writeFile(counterFilePath, JSON.stringify({
      validReportsCount: currentCount,
      updatedAt: new Date().toISOString()
    }, null, 2));

    return currentCount;
  } catch (error) {
    console.error(`Error updating counter for ${orgId}:`, error);
    return 0;
  }
}