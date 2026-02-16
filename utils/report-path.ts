// utils/report-path.ts
import { promises as fs } from 'fs';
import path from 'path';

// Types for organization data
interface OrganizationReportData {
  id: string;
  name: string;
  shortNumber?: string | null;
}

type PaymentType = 'prepaid' | 'postpaid';

// ✅ FIXED: Use absolute path only once at module level
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
 * ✅ OPTIMIZED: Build report path at runtime to avoid Turbopack warnings
 * @param orgFolder - Organization folder name
 * @param year - Report year
 * @param month - Report month
 * @param paymentType - Payment type
 * @returns Full path to the report directory
 */
function buildReportPath(
  orgFolder: string,
  year: number,
  month: number,
  paymentType: PaymentType
): string {
  // Build path segments separately and join at runtime
  const segments = [
    ORIGINAL_REPORTS_PATH,
    orgFolder,
    year.toString(),
    month.toString().padStart(2, '0'),
    paymentType
  ];
  
  return segments.join(path.sep);
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
  return buildReportPath(orgFolderName, year, month, paymentType);
}

/**
 * ✅ OPTIMIZED: Safely check if directory exists
 */
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * ✅ OPTIMIZED: Safely read directory with fallback
 */
async function safeReadDir(dirPath: string): Promise<string[]> {
  try {
    return await fs.readdir(dirPath);
  } catch (error) {
    console.warn(`Failed to read directory: ${dirPath}`);
    return [];
  }
}

/**
 * ✅ OPTIMIZED: Find Excel files in directory
 */
async function findExcelFiles(dirPath: string): Promise<string[]> {
  const files = await safeReadDir(dirPath);
  return files.filter(f => {
    const lower = f.toLowerCase();
    return lower.endsWith('.xls') || lower.endsWith('.xlsx');
  });
}

/**
 * Get the original report value from existing XLS files
 * @param orgData - Organization data
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

    const orgFolderName = generateOrganizationFolderName(
      orgData.shortNumber || 'unknown', 
      orgData.name
    );
    console.log('Generated folder name:', orgFolderName);
    
    // ✅ FIXED: Use helper function
    const originalReportPath = buildReportPath(orgFolderName, year, month, paymentType);
    console.log(`Looking for original reports in: ${originalReportPath}`);

    // ✅ OPTIMIZED: Use safe directory read
    const excelFiles = await findExcelFiles(originalReportPath);
    
    if (excelFiles.length === 0) {
      console.log(`❌ No Excel file found in ${originalReportPath}`);
      return 0;
    }

    const xlsFile = excelFiles[0]; // Use first Excel file found
    const filePath = path.join(originalReportPath, xlsFile);
    console.log(`Found original report: ${filePath}`);

    try {
      let value = 0;

      if (xlsFile.toLowerCase().endsWith('.xls')) {
        console.log('Reading .xls file with SheetJS...');
        
        // Dynamic import to reduce bundle size
        const XLSX = await import('xlsx');
        const fileBuffer = await fs.readFile(filePath);
        const workbook = XLSX.read(fileBuffer, { 
          type: 'buffer',
          cellText: false,
          cellNF: false,
          cellHTML: false 
        });
        
        console.log('✓ Successfully read .xls file with SheetJS');
        console.log('Sheet names:', workbook.SheetNames);

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
        
        // Dynamic import to reduce bundle size
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        console.log('✓ Successfully read .xlsx file with ExcelJS');

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
              value = typeof lastCell.value === 'number' 
                ? lastCell.value 
                : parseFloat(lastCell.value as string) || 0;
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
              value = typeof lastCell.value === 'number' 
                ? lastCell.value 
                : parseFloat(lastCell.value as string) || 0;
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
    const excelFiles = await findExcelFiles(reportPath);
    return excelFiles.length > 0;
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
    return await findExcelFiles(reportPath);
  } catch (error) {
    return [];
  }
}

/**
 * Parse report URL path to extract metadata
 * @param fileUrl - Report file URL
 * @returns Parsed report metadata
 */
export function parseReportPath(fileUrl: string) {
  // Example: /reports/5800 - Fondacija/2025/08/prepaid/Servis__Micropayment...
  const parts = fileUrl.split("/");

  // Expected: ["", "reports", "5800 - Fondacija", "2025", "08", "prepaid", "Servis__..."]
  const year = parts[3] ? parseInt(parts[3], 10) : null;
  const month = parts[4] ? parseInt(parts[4], 10) : null;

  return {
    year,
    month,
    orgFolder: parts[2] || null,
    paymentType: parts[5] as PaymentType | null,
    fileName: parts[parts.length - 1] || null,
  };
}

// Export for use in other modules
export { getOriginalReportValue };