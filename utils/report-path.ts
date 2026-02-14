//utils/report-path.ts
import { promises as fs } from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

// Types for organization data
interface OrganizationReportData {
  id: string;
  name: string;
  shortNumber?: string | null;
}

type PaymentType = 'prepaid' | 'postpaid';

const ORIGINAL_REPORTS_PATH = path.join(process.cwd(), 'public', 'reports');

/**
 * Generate a standardized folder name for organization reports
 * @param shortNumber - Organization's short number
 * @param organizationName - Organization's full name
 * @returns Formatted folder name in format "shortNumber - organizationName"
 */
export function generateOrganizationFolderName(
  shortNumber: string | null | undefined, 
  organizationName: string | null | undefined
): string {
  try {
    // Validate organization name
    if (!organizationName || typeof organizationName !== 'string') {
      console.error('Invalid organization name provided:', organizationName);
      return `${shortNumber || 'org'} - unknown`;
    }

    // Use shortNumber if available, otherwise use 'org'
    const prefix = shortNumber || 'org';
    
    // Normalize spacing - replace multiple spaces with single space, trim
    const normalizedName = organizationName.replace(/\s+/g, ' ').trim();
    
    // Keep the original organization name with normalized spacing
    return `${prefix} - ${normalizedName}`;
  } catch (error) {
    console.error('Error generating organization folder name:', error);
    // Fallback to basic format with normalized spacing
    const fallbackName = organizationName ? organizationName.replace(/\s+/g, ' ').trim() : 'unknown';
    return `${shortNumber || 'org'} - ${fallbackName}`;
  }
}

/**
 * Generate the full path to organization's report directory
 * @param orgData - Organization data
 * @param year - Report year
 * @param month - Report month
 * @param paymentType - Payment type (prepaid/postpaid)
 * @returns Full path to the report directory
 */
export function generateReportPath(
  orgData: OrganizationReportData,
  year: number,
  month: number,
  paymentType: PaymentType
): string {
  const orgFolderName = generateOrganizationFolderName(orgData.shortNumber, orgData.name);
  
  return path.join(
    ORIGINAL_REPORTS_PATH,
    orgFolderName,
    year.toString(),
    month.toString().padStart(2, '0'),
    paymentType
  );
}

/**
 * Get the original report value from existing XLS files
 * @param org - Organization data
 * @param month - Report month
 * @param year - Report year
 * @param paymentType - Payment type
 * @returns The extracted value from the report
 */
async function getOriginalReportValue(
  orgData: OrganizationReportData,
  month: number,
  year: number,
  paymentType: PaymentType
): Promise<number> {
  try {
    console.log('=== DEBUG getOriginalReportValue ===');
    console.log('Input params:', { orgData, month, year, paymentType });

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
      console.log('Files in directory:', files);
    } catch (error) {
      console.log(`❌ Original reports directory not found: ${originalReportPath}`);
      return 0;
    }

    const xlsFile = files.find(f => f.toLowerCase().endsWith('.xls') || f.toLowerCase().endsWith('.xlsx'));
    if (!xlsFile) {
      console.log(`❌ No Excel file found in ${originalReportPath}`);
      return 0;
    }

    const filePath = path.join(originalReportPath, xlsFile);
    console.log(`Found original report: ${filePath}`);

    try {
      let workbook;
      
      if (xlsFile.toLowerCase().endsWith('.xls')) {
        console.log('Reading .xls file with SheetJS...');
        
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
            
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1, 
              defval: '', 
              raw: false 
            });
            
            console.log('Total rows:', jsonData.length);
            
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
            
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1, 
              defval: '', 
              raw: false 
            });
            
            console.log('Total rows:', jsonData.length);
            
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

/**
 * Check if report file exists for organization
 * @param orgData - Organization data
 * @param year - Report year
 * @param month - Report month
 * @param paymentType - Payment type
 * @returns Boolean indicating if report exists
 */
export async function reportExists(
  orgData: OrganizationReportData,
  year: number,
  month: number,
  paymentType: PaymentType
): Promise<boolean> {
  try {
    const reportPath = generateReportPath(orgData, year, month, paymentType);
    const files = await fs.readdir(reportPath);
    return files.some(f => f.toLowerCase().endsWith('.xls') || f.toLowerCase().endsWith('.xlsx'));
  } catch (error) {
    return false;
  }
}

/**
 * Get all available report files for organization
 * @param orgData - Organization data
 * @param year - Report year
 * @param month - Report month
 * @param paymentType - Payment type
 * @returns Array of file names
 */
export async function getReportFiles(
  orgData: OrganizationReportData,
  year: number,
  month: number,
  paymentType: PaymentType
): Promise<string[]> {
  try {
    const reportPath = generateReportPath(orgData, year, month, paymentType);
    const files = await fs.readdir(reportPath);
    return files.filter(f => f.toLowerCase().endsWith('.xls') || f.toLowerCase().endsWith('.xlsx'));
  } catch (error) {
    return [];
  }
}

export function parseReportPath(fileUrl: string) {
  // primer: /reports/5800 - Fondacija/2025/08/prepaid/Servis__Micropayment...
  const parts = fileUrl.split("/");

  // očekujemo: ["", "reports", "5800 - Fondacija", "2025", "08", "prepaid", "Servis__..."]
  const year = parts[4] ? parseInt(parts[4], 10) : null;
  const month = parts[5] ? parseInt(parts[5], 10) : null;

  return {
    year,
    month,
    orgFolder: parts[3] || null,
    fileName: parts[parts.length - 1] || null,
  };
}