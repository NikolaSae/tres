/////actions/reports/generate-humanitarian-templates.ts
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { db } from "@/lib/db";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { sr } from 'date-fns/locale';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
  registrationNumber: string | null;
  pib: string | null;
  contracts: Array<{
    name: string;
  }>;
}

const MASTER_TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'humanitarian-template.xlsx');
const REPORTS_BASE_PATH = path.join(process.cwd(), 'reports');

export async function generateHumanitarianTemplates(
  month: number,
  year: number,
  paymentType: string
): Promise<TemplateGenerationResult> {
  const generatedFiles: TemplateGenerationResult['generatedFiles'] = [];
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

    // Get all active humanitarian organizations with active contracts
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
        registrationNumber: true,
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
        const result = await generateTemplateForOrganization(
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
      message: `Uspešno generisano ${successCount} od ${organizations.length} template(s)`,
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
  paymentType: string
): Promise<NonNullable<TemplateGenerationResult['generatedFiles']>[0]> {
  
  try {
    // Create organization folder structure
    const orgFolderPath = path.join(REPORTS_BASE_PATH, org.id, year.toString(), month.toString().padStart(2, '0'));
    await fs.mkdir(orgFolderPath, { recursive: true });

    // Generate filename
    const fileName = `template_${org.name.replace(/[^a-zA-Z0-9]/g, '_')}_${month.toString().padStart(2, '0')}_${year}.xlsx`;
    const filePath = path.join(orgFolderPath, fileName);

    // METHOD 1: Try using ExcelJS (better formatting preservation)
    try {
      const result = await generateWithExcelJS(org, month, year, paymentType, filePath);
      if (result) {
        return {
          organizationName: org.name,
          fileName,
          status: 'success'
        };
      }
    } catch (error) {
      console.log('ExcelJS failed, trying alternative method:', error);
    }

    // METHOD 2: Fallback - Copy template and use Python script (if available)
    try {
      const result = await generateWithPythonScript(org, month, year, paymentType, filePath);
      if (result) {
        return {
          organizationName: org.name,
          fileName,
          status: 'success'
        };
      }
    } catch (error) {
      console.log('Python script failed, using basic copy method:', error);
    }

    // METHOD 3: Last resort - Simple file copy and manual data injection
    await generateWithSimpleCopy(org, month, year, paymentType, filePath);

    return {
      organizationName: org.name,
      fileName,
      status: 'success'
    };

  } catch (error) {
    throw new Error(`Greška za organizaciju ${org.name}: ${error instanceof Error ? error.message : 'Nepoznata greška'}`);
  }
}

async function generateWithExcelJS(
  org: OrganizationData,
  month: number,
  year: number,
  paymentType: string,
  filePath: string
): Promise<boolean> {
  try {
    // Try to import ExcelJS dynamically
    const ExcelJS = await import('exceljs');
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(MASTER_TEMPLATE_PATH);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('Worksheet not found');
    }

    // Get data
    const prevMonthValue = await getPreviousMonthData(org.id, month, year);
    const currentCounter = await getCurrentMonthCounter(org.id, month, year);
    
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    const dateRange = `${format(monthStart, 'dd.MM.yyyy')} do ${format(monthEnd, 'dd.MM.yyyy')}`;

    // Get month name in Serbian for D38
    const monthNames = [
      'јануару', 'фебруару', 'марту', 'априлу', 'мају', 'јуну',
      'јулу', 'августу', 'септембру', 'октобру', 'новембру', 'децембру'
    ];
    const monthNameSr = monthNames[month - 1];

    // Update cells while preserving formatting
    const activeContract = org.contracts && org.contracts.length > 0 ? org.contracts[0] : null;
    const updates = [
      { cell: 'C19', value: activeContract?.name || '' },
      { cell: 'D21', value: org.name },
      { cell: 'D24', value: prevMonthValue },
      { cell: 'D27', value: org.accountNumber || '' },
      { cell: 'D28', value: `Матични број ${org.registrationNumber || ''}` },
      { cell: 'D29', value: `ПИБ ${org.pib || ''}` },
      { cell: 'E39', value: dateRange },
      { cell: 'D38', value: `Наплаћен износ у ${paymentType} саобраћају у ${monthNameSr} периоду` },
      { cell: 'E18', value: `/${month.toString().padStart(2, '0')}` },
      { cell: 'D18', value: currentCounter }
    ];

    updates.forEach(({ cell, value }) => {
      const cellObj = worksheet.getCell(cell);
      cellObj.value = value;
      // ExcelJS preserves formatting automatically
    });

    await workbook.xlsx.writeFile(filePath);
    await updateMonthCounter(org.id, month, year, currentCounter);
    
    return true;
  } catch (error) {
    console.error('ExcelJS method failed:', error);
    return false;
  }
}

async function generateWithPythonScript(
  org: OrganizationData,
  month: number,
  year: number,
  paymentType: string,
  filePath: string
): Promise<boolean> {
  try {
    // Check if Python and openpyxl are available
    await execAsync('python3 -c "import openpyxl"');
    
    const prevMonthValue = await getPreviousMonthData(org.id, month, year);
    const currentCounter = await getCurrentMonthCounter(org.id, month, year);
    
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    const dateRange = `${format(monthStart, 'dd.MM.yyyy')} do ${format(monthEnd, 'dd.MM.yyyy')}`;

    // Get month name in Serbian for D38
    const monthNames = [
      'јануару', 'фебруару', 'марту', 'априлу', 'мају', 'јуну',
      'јулу', 'августу', 'септембру', 'октобру', 'новембру', 'децембру'
    ];
    const monthNameSr = monthNames[month - 1];

    const activeContract = org.contracts && org.contracts.length > 0 ? org.contracts[0] : null;

    // Create Python script for Excel manipulation
    const pythonScript = `
import openpyxl
import sys
import json

def update_excel(template_path, output_path, updates):
    wb = openpyxl.load_workbook(template_path)
    ws = wb.active
    
    for cell, value in updates.items():
        ws[cell] = value
    
    wb.save(output_path)
    return True

if __name__ == "__main__":
    template_path = "${MASTER_TEMPLATE_PATH.replace(/\\/g, '\\\\')}"
    output_path = "${filePath.replace(/\\/g, '\\\\')}"
    
    updates = {
        "C19": "${activeContract?.name || ''}",
        "D21": "${org.name}",
        "D24": ${prevMonthValue},
        "D27": "${org.accountNumber || ''}",
        "D28": "Матични број ${org.registrationNumber || ''}",
        "D29": "ПИБ ${org.pib || ''}",
        "E39": "${dateRange}",
        "D38": "Наплаћен износ у ${paymentType} саобраћају у ${monthNameSr} периоду",
        "E18": "/${month.toString().padStart(2, '0')}",
        "D18": ${currentCounter}
    }
    
    try:
        update_excel(template_path, output_path, updates)
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
`;

    // Write Python script to temp file
    const tempScriptPath = path.join(process.cwd(), 'temp_excel_update.py');
    await fs.writeFile(tempScriptPath, pythonScript);
    
    // Execute Python script
    const { stdout, stderr } = await execAsync(`python3 ${tempScriptPath}`);
    
    // Clean up temp script
    await fs.unlink(tempScriptPath);
    
    if (stdout.includes('SUCCESS')) {
      await updateMonthCounter(org.id, month, year, currentCounter);
      return true;
    } else {
      throw new Error(stderr || 'Python script failed');
    }
    
  } catch (error) {
    console.error('Python script method failed:', error);
    return false;
  }
}

async function generateWithSimpleCopy(
  org: OrganizationData,
  month: number,
  year: number,
  paymentType: string,
  filePath: string
): Promise<void> {
  // Simple file copy - user will need to manually update data
  await fs.copyFile(MASTER_TEMPLATE_PATH, filePath);
  
  // Create a JSON file with the data that needs to be inserted
  const prevMonthValue = await getPreviousMonthData(org.id, month, year);
  const currentCounter = await getCurrentMonthCounter(org.id, month, year);
  
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));
  const dateRange = `${format(monthStart, 'dd.MM.yyyy')} do ${format(monthEnd, 'dd.MM.yyyy')}`;

  // Get month name in Serbian for D38
  const monthNames = [
    'јануару', 'фебруару', 'марту', 'априлу', 'мају', 'јуну',
    'јулу', 'августу', 'септембру', 'октобру', 'новембру', 'децембру'
  ];
  const monthNameSr = monthNames[month - 1];

  const activeContract = org.contracts && org.contracts.length > 0 ? org.contracts[0] : null;

  const dataToInsert = {
    C19: activeContract?.name || '',
    D21: org.name,
    D24: prevMonthValue,
    D27: org.accountNumber || '',
    D28: `Матични број ${org.registrationNumber || ''}`,
    D29: `ПИБ ${org.pib || ''}`,
    E39: dateRange,
    D38: `Наплаћен износ у ${paymentType} саобраћају у ${monthNameSr} периоду`,
    E18: `/${month.toString().padStart(2, '0')}`,
    D18: currentCounter,
    _metadata: {
      organization: org.name,
      month: month,
      year: year,
      paymentType: paymentType,
      generatedAt: new Date().toISOString(),
      note: 'Ove vrednosti treba uneti u odgovarajuće ćelije Excel fajla'
    }
  };
  
  const dataFilePath = path.join(path.dirname(filePath), 'data_to_insert.json');
  await fs.writeFile(dataFilePath, JSON.stringify(dataToInsert, null, 2));
  
  await updateMonthCounter(org.id, month, year, currentCounter);
}

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
      const reportFile = files.find(f => f.endsWith('.xlsx') && f.startsWith('template_'));
      
      if (reportFile) {
        // Try to read with ExcelJS first for better compatibility
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
          console.log('Could not read previous month data with ExcelJS, checking data file');
          
          // Fallback: check if there's a data_to_insert.json file with the previous value
          const dataFilePath = path.join(prevReportPath, 'data_to_insert.json');
          try {
            const dataContent = await fs.readFile(dataFilePath, 'utf8');
            const data = JSON.parse(dataContent);
            return typeof data.D24 === 'number' ? data.D24 : 0;
          } catch (dataFileError) {
            console.log('No data file found either');
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