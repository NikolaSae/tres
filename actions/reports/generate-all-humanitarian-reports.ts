// actions/reports/generate-all-humanitarian-reports.ts
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { db } from "@/lib/db";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
  maticni_broj: string | null;
  pib: string | null;
  contracts: Array<{
    name: string;
  }>;
  // Add relevant data fields for the complete report
  monthlyRevenue?: number;
  totalTransactions?: number;
  serviceUsage?: {
    postpaid?: number;
    prepaid?: number;
  };
}

const MASTER_TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'humanitarian-template-telekom.xlsx');
const REPORTS_BASE_PATH = path.join(process.cwd(), 'reports');

export async function generateAllHumanitarianReports(
  month: number,
  year: number,
  paymentType: string
): Promise<ReportGenerationResult> {
  const generatedFiles: ReportGenerationResult['generatedFiles'] = [];
  const errors: string[] = [];

  try {
    // Validate master template exists
    try {
      await fs.access(MASTER_TEMPLATE_PATH);
    } catch {
      return {
        success: false,
        message: 'Master template fajl nije pronađen',
        processed: 0,
        errors: ['Master template fajl nije dostupan na putanji: ' + MASTER_TEMPLATE_PATH]
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
          paymentType
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
      message: `Uspešno generisano ${successCount} od ${organizations.length} kompletnih izveštaja`,
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
  paymentType: string
): Promise<OrganizationReportData[]> {
  const organizations = await db.humanitarianOrg.findMany({
    where: {
      isActive: true,
      contracts: {
  select: {
    name: true,
    contractNumber: true,
    startDate: true,  // NEDOSTAJE
    endDate: true     // NEDOSTAJE
  }
}
    },
    select: {
      id: true,
      name: true,
      accountNumber: true,
      maticni_broj: true,
      pib: true,
      contracts: {
        where: {
          status: 'ACTIVE',
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        },
        select: {
          name: true
        },
        take: 1
      }
    }
  });

  // Enhance with report-specific data
  const enhancedOrganizations: OrganizationReportData[] = [];

  for (const org of organizations) {
    // Get monthly revenue/transaction data from your database
    // This is where you'd query your transaction/payment tables
    const monthlyData = await getMonthlyDataForOrganization(org.id, month, year, paymentType);
    
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
  month: number,
  year: number,
  paymentType: string
) {
  // This would be replaced with actual queries to your payment/transaction tables
  // Example implementation:
  
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  try {
    // Example query structure - adapt to your actual database schema
    const transactions = await db.$queryRaw`
      SELECT 
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        service_type
      FROM transactions 
      WHERE organization_id = ${orgId}
        AND payment_type = ${paymentType}
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY service_type
    ` as Array<{
      transaction_count: bigint;
      total_amount: number | null;
      service_type: string;
    }>;

    const revenue = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    const transactionCount = transactions.reduce((sum, t) => sum + Number(t.transaction_count), 0);
    
    const serviceUsage = transactions.reduce((acc, t) => {
      if (t.service_type === 'postpaid') {
        acc.postpaid = Number(t.transaction_count);
      } else if (t.service_type === 'prepaid') {
        acc.prepaid = Number(t.transaction_count);
      }
      return acc;
    }, { postpaid: 0, prepaid: 0 });

    return {
      revenue,
      transactions: transactionCount,
      serviceUsage
    };
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
  paymentType: string
): Promise<NonNullable<ReportGenerationResult['generatedFiles']>[0]> {
  
  try {
    // Create organization folder structure
    const orgFolderPath = path.join(REPORTS_BASE_PATH, org.id, year.toString(), month.toString().padStart(2, '0'));
    await fs.mkdir(orgFolderPath, { recursive: true });

    // Generate filename for complete report
    const fileName = `report_${org.name.replace(/[^a-zA-Z0-9]/g, '_')}_${month.toString().padStart(2, '0')}_${year}.xlsx`;
    const filePath = path.join(orgFolderPath, fileName);

    // Try different methods for generating the complete report
    try {
      const result = await generateCompleteReportWithExcelJS(org, month, year, paymentType, filePath);
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

    // Fallback to basic template with additional data
    await generateReportWithFallback(org, month, year, paymentType, filePath);

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
  paymentType: string,
  filePath: string
): Promise<boolean> {
  try {
    const ExcelJS = await import('exceljs');
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(MASTER_TEMPLATE_PATH);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('Worksheet not found');
    }

    // Get previous month data and current counter
    const prevMonthValue = await getPreviousMonthData(org.id, month, year);
    const currentCounter = await getCurrentMonthCounter(org.id, month, year);
    
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    const dateRange = `${format(monthStart, 'dd.MM.yyyy')} do ${format(monthEnd, 'dd.MM.yyyy')}`;

    // Serbian month names
    const monthNames = [
      'јануару', 'фебруару', 'марту', 'априлу', 'мају', 'јуну',
      'јулу', 'августу', 'септембру', 'октобру', 'новембру', 'децембру'
    ];
    const monthNameSr = monthNames[month - 1];

    const activeContract = org.contracts && org.contracts.length > 0 ? org.contracts[0] : null;

    // Update cells with organization data and actual report data
    const updates = [
      // Basic organization info
      { cell: 'C19', value: activeContract?.name || '' },
      { cell: 'D21', value: org.name },
      { cell: 'D24', value: prevMonthValue + (org.monthlyRevenue || 0) }, // Add current month revenue
      { cell: 'D27', value: org.accountNumber || '' },
      { cell: 'D28', value: `Матични број ${org.registrationNumber || ''}` },
      { cell: 'D29', value: `ПИБ ${org.pib || ''}` },
      { cell: 'E39', value: dateRange },
      { cell: 'D38', value: `Наплаћен износ у ${paymentType} саобраћају у ${monthNameSr} периоду` },
      { cell: 'E18', value: `/${month.toString().padStart(2, '0')}` },
      { cell: 'D18', value: currentCounter },
      
      // Additional report data (adapt cell references to your template)
      { cell: 'F24', value: org.monthlyRevenue || 0 }, // Current month revenue
      { cell: 'G24', value: org.totalTransactions || 0 }, // Transaction count
      
      // Service usage breakdown if your template supports it
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
        // Continue with other cells even if one fails
      }
    });

    await workbook.xlsx.writeFile(filePath);
    await updateMonthCounter(org.id, month, year, currentCounter);
    
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
  paymentType: string,
  filePath: string
): Promise<void> {
  // Copy template and create detailed JSON with all report data
  await fs.copyFile(MASTER_TEMPLATE_PATH, filePath);
  
  const prevMonthValue = await getPreviousMonthData(org.id, month, year);
  const currentCounter = await getCurrentMonthCounter(org.id, month, year);
  
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));
  const dateRange = `${format(monthStart, 'dd.MM.yyyy')} do ${format(monthEnd, 'dd.MM.yyyy')}`;

  const monthNames = [
    'јануару', 'фебруару', 'марту', 'априлу', 'мају', 'јуну',
    'јулу', 'августу', 'септембру', 'октобру', 'новембру', 'децембру'
  ];
  const monthNameSr = monthNames[month - 1];

  const activeContract = org.contracts && org.contracts.length > 0 ? org.contracts[0] : null;

  const completeReportData = {
    // Basic template data
    C19: activeContract?.name || '',
    D21: org.name,
    D24: prevMonthValue + (org.monthlyRevenue || 0),
    D27: org.accountNumber || '',
    D28: `Матични број ${org.registrationNumber || ''}`,
    D29: `ПИБ ${org.pib || ''}`,
    E39: dateRange,
    D38: `Наплаћен износ у ${paymentType} саобраћају у ${monthNameSr} периоду`,
    E18: `/${month.toString().padStart(2, '0')}`,
    D18: currentCounter,
    
    // Additional report data
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
  
  await updateMonthCounter(org.id, month, year, currentCounter);
}

// Helper functions (reuse from the template generator)
async function getPreviousMonthData(orgId: string, month: number, year: number): Promise<number> {
  try {
    let prevMonth = month - 1;
    let prevYear = year;
    
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }

    const prevReportPath = path.join(
      REPORTS_BASE_PATH,
      orgId,
      prevYear.toString(),
      prevMonth.toString().padStart(2, '0')
    );

    try {
      const files = await fs.readdir(prevReportPath);
      const reportFile = files.find(f => f.endsWith('.xlsx') && (f.startsWith('template_') || f.startsWith('report_')));
      
      if (reportFile) {
        try {
          const ExcelJS = await import('exceljs');
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.readFile(path.join(prevReportPath, reportFile));
          const worksheet = workbook.getWorksheet(1);
          const cell = worksheet?.getCell('D24');
          
          if (cell && cell.value !== null && cell.value !== undefined) {
            return typeof cell.value === 'number' ? cell.value : parseFloat(cell.value as string) || 0;
          }
        } catch (excelJSError) {
          // Check JSON data files as fallback
          const dataFiles = ['complete_report_data.json', 'data_to_insert.json'];
          for (const dataFile of dataFiles) {
            try {
              const dataFilePath = path.join(prevReportPath, dataFile);
              const dataContent = await fs.readFile(dataFilePath, 'utf8');
              const data = JSON.parse(dataContent);
              if (typeof data.D24 === 'number') {
                return data.D24;
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.log(`No previous month data found for ${orgId}, using 0`);
    }

    return 0;
  } catch (error) {
    console.error(`Error getting previous month data for ${orgId}:`, error);
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
      const { counter } = JSON.parse(counterData);
      return counter + 1;
    } catch (error) {
      return 1;
    }
  } catch (error) {
    console.error(`Error getting counter for ${orgId}:`, error);
    return 1;
  }
}

async function updateMonthCounter(orgId: string, month: number, year: number, counter: number): Promise<void> {
  try {
    const counterFilePath = path.join(
      REPORTS_BASE_PATH,
      orgId,
      year.toString(),
      month.toString().padStart(2, '0'),
      'counter.json'
    );

    const counterData = {
      counter,
      lastUpdated: new Date().toISOString(),
      month,
      year,
      organizationId: orgId
    };

    await fs.writeFile(counterFilePath, JSON.stringify(counterData, null, 2));
  } catch (error) {
    console.error(`Error updating counter for ${orgId}:`, error);
  }
}