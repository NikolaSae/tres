// actions/reports/scan-unified-reports.ts
'use server';

import { promises as fs } from 'fs';
import path from 'path';

interface UnifiedReport {
  id: string;
  fileName: string;
  filePath: string;
  publicUrl: string;
  month: number;
  year: number;
  paymentType: 'prepaid' | 'postpaid' | 'combined';
  fileSize: number;
  lastModified: Date;
  organizationCount?: number;
  totalSum?: number | null;
}

interface UnifiedScanResult {
  success: boolean;
  reports: UnifiedReport[];
  totalFiles: number;
  error?: string;
}

// Cache for quick lookups
const unifiedCache = new Map<string, { data: UnifiedReport; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const MONTH_NAMES_SR = [
  'januar', 'februar', 'mart', 'april', 'maj', 'jun',
  'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'
];

export async function scanUnifiedReports(): Promise<UnifiedScanResult> {
  const startTime = Date.now();
  console.log('Starting unified reports scan...');

  try {
    // Unified reports are in public/reports/prepaid/
    const prepaidPath = path.join(process.cwd(), 'public', 'reports', 'prepaid');
    
    try {
      await fs.access(prepaidPath);
    } catch {
      console.log('Prepaid directory not found, creating...');
      await fs.mkdir(prepaidPath, { recursive: true });
      return {
        success: true,
        reports: [],
        totalFiles: 0
      };
    }

    const reports = await scanPrepaidDirectory(prepaidPath);
    
    // Sort by year and month (newest first)
    reports.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      if (b.month !== a.month) return b.month - a.month;
      return b.lastModified.getTime() - a.lastModified.getTime();
    });

    console.log(`Unified scan completed in ${Date.now() - startTime}ms. Found ${reports.length} unified reports.`);

    return {
      success: true,
      reports,
      totalFiles: reports.length
    };
  } catch (error) {
    console.error('Error scanning unified reports:', error);
    return {
      success: false,
      reports: [],
      totalFiles: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

async function scanPrepaidDirectory(dirPath: string): Promise<UnifiedReport[]> {
  const reports: UnifiedReport[] = [];
  
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    
    // Filter only Excel files that match the unified report pattern
    const excelFiles = files.filter(file => 
      file.isFile() && 
      (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) &&
      file.name.includes('Humanitarni_SMS_i_VOICE_brojevi')
    );
    
    for (const file of excelFiles) {
      try {
        const filePath = path.join(dirPath, file.name);
        const stat = await fs.stat(filePath);
        
        const report = await createUnifiedReport(
          filePath,
          file.name,
          stat
        );
        
        if (report) {
          reports.push(report);
        }
      } catch (error) {
        console.error(`Error processing unified file ${file.name}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error reading prepaid directory ${dirPath}:`, error);
  }
  
  return reports;
}

async function createUnifiedReport(
  filePath: string,
  fileName: string,
  stat: any
): Promise<UnifiedReport | null> {
  try {
    // Check cache first
    const cacheKey = filePath;
    const cached = unifiedCache.get(cacheKey);
    const fileTimestamp = stat.mtime.getTime();
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL) && cached.timestamp >= fileTimestamp) {
      return cached.data;
    }
    
    // Parse month and year from filename
    // Format: "Humanitarni_SMS_i_VOICE_brojevi_2021-2025-Septembar_2025.xlsx"
    const { month, year } = parseFileNameDate(fileName);
    
    if (!month || !year) {
      console.warn(`Could not parse date from filename: ${fileName}`);
      return null;
    }
    
    // Unified reports in prepaid folder are always prepaid type
    const paymentType: 'prepaid' | 'postpaid' | 'combined' = 'prepaid';
    
    // Create public URL
    const relativePath = path.relative(path.join(process.cwd(), 'public'), filePath);
    const publicUrl = '/' + relativePath.replace(/\\/g, '/');
    
    // Count organizations and get total sum
    const { organizationCount, totalSum } = await getUnifiedReportMetadata(filePath, fileName);
    
    const report: UnifiedReport = {
      id: `unified-${year}-${month}-${paymentType}-${fileName}`,
      fileName,
      filePath,
      publicUrl,
      month,
      year,
      paymentType,
      fileSize: stat.size,
      lastModified: stat.mtime,
      organizationCount,
      totalSum
    };
    
    // Cache the result
    unifiedCache.set(cacheKey, {
      data: report,
      timestamp: Date.now()
    });
    
    return report;
  } catch (error) {
    console.error(`Error creating unified report object for ${fileName}:`, error);
    return null;
  }
}

/**
 * Parse month and year from unified report filename
 * Format: "Humanitarni_SMS_i_VOICE_brojevi_2021-2025-Septembar_2025.xlsx"
 * Returns: { month: 9, year: 2025 }
 */
function parseFileNameDate(fileName: string): { month: number | null; year: number | null } {
  try {
    // Remove extension
    const nameWithoutExt = fileName.replace(/\.(xlsx|xls)$/i, '');
    
    // Split by underscore or hyphen
    const parts = nameWithoutExt.split(/[-_]/);
    
    // Find month name (in Serbian)
    let month: number | null = null;
    let year: number | null = null;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].toLowerCase();
      
      // Check if it's a month name
      const monthIndex = MONTH_NAMES_SR.findIndex(m => m === part);
      if (monthIndex !== -1) {
        month = monthIndex + 1;
        
        // Year should be the next part
        if (i + 1 < parts.length) {
          const yearPart = parts[i + 1];
          const parsedYear = parseInt(yearPart);
          if (!isNaN(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100) {
            year = parsedYear;
          }
        }
        break;
      }
    }
    
    // If month not found by name, try to find pattern like "09_2025" or "9_2025"
    if (!month || !year) {
      const datePattern = /(\d{1,2})[_-](\d{4})/;
      const match = nameWithoutExt.match(datePattern);
      if (match) {
        const monthNum = parseInt(match[1]);
        const yearNum = parseInt(match[2]);
        if (monthNum >= 1 && monthNum <= 12 && yearNum >= 2000 && yearNum <= 2100) {
          month = monthNum;
          year = yearNum;
        }
      }
    }
    
    return { month, year };
  } catch (error) {
    console.error('Error parsing filename date:', error);
    return { month: null, year: null };
  }
}

async function getUnifiedReportMetadata(
  filePath: string, 
  fileName: string
): Promise<{ organizationCount: number; totalSum: number | null }> {
  try {
    const isXls = filePath.toLowerCase().endsWith('.xls');
    
    if (isXls) {
      return await readXlsMetadata(filePath);
    } else {
      return await readXlsxMetadata(filePath);
    }
  } catch (error) {
    console.error('Error reading unified report metadata:', error);
    return { organizationCount: 0, totalSum: null };
  }
}

async function readXlsMetadata(filePath: string): Promise<{ organizationCount: number; totalSum: number | null }> {
  try {
    const XLSX = await import('xlsx');
    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { 
      type: 'buffer',
      cellText: false,
      cellNF: false,
      raw: true
    });
    
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!worksheet) return { organizationCount: 0, totalSum: null };
    
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    let organizationCount = 0;
    let totalSum: number | null = null;
    let totalRowIndex: number | null = null;
    
    console.log(`[Excel Debug] Reading ${filePath.split(/[/\\]/).pop()}`);
    console.log(`[Excel Debug] Range: ${worksheet['!ref']}, Rows: ${range.e.r + 1}`);
    
    // First pass: Find the "Ukupno"/"Total" row
    for (let row = range.e.r; row >= 0; row--) {
      const cellA = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
      const cellB = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })];
      const cellC = worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })];
      
      const cellValue = (cellA?.v || cellB?.v || cellC?.v || '').toString().toLowerCase();
      
      if (cellValue.includes('ukupno') || cellValue.includes('total') || cellValue.includes('suma')) {
        totalRowIndex = row;
        console.log(`[Excel Debug] Found total row at ${row}: "${cellValue.substring(0, 30)}"`);
        
        // Look for sum in columns C through H
        for (let col = 2; col <= 7; col++) {
          const sumCell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
          if (sumCell?.v && typeof sumCell.v === 'number' && sumCell.v > 100) {
            console.log(`[Excel Debug] Found sum in column ${String.fromCharCode(65 + col)}: ${sumCell.v}`);
            if (!totalSum || sumCell.v > totalSum) {
              totalSum = sumCell.v;
            }
          }
        }
        break;
      }
    }
    
    // Second pass: Count organizations (rows before total row or all rows if no total)
    const endRow = totalRowIndex !== null ? totalRowIndex : range.e.r;
    const startRow = 2; // Skip first 2 rows (usually headers)
    
    for (let row = startRow; row < endRow; row++) {
      const cellA = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
      const cellB = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })];
      
      const hasDataA = cellA?.v && String(cellA.v).trim().length > 0;
      const hasDataB = cellB?.v && String(cellB.v).trim().length > 0;
      
      if (hasDataA || hasDataB) {
        organizationCount++;
      }
    }
    
    console.log(`[Excel Debug] Organizations: ${organizationCount}, Total: ${totalSum}`);
    
    return { organizationCount, totalSum };
  } catch (error) {
    console.error('Error reading XLS metadata:', error);
    return { organizationCount: 0, totalSum: null };
  }
}

async function readXlsxMetadata(filePath: string): Promise<{ organizationCount: number; totalSum: number | null }> {
  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) return { organizationCount: 0, totalSum: null };
    
    let organizationCount = 0;
    let totalSum: number | null = null;
    let lastRowWithData = 0;
    
    // Count rows with data (skip header - first 2-3 rows)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 2) { // Skip first 2 rows (header)
        const firstCell = row.getCell(1);
        const secondCell = row.getCell(2);
        
        if (firstCell.value || secondCell.value) {
          const cellValue = (firstCell.value || secondCell.value || '').toString().toLowerCase();
          
          // Check if this is a total row
          if (cellValue.includes('ukupno') || cellValue.includes('total')) {
            // Try to find sum in this row (columns C, D, E, F)
            for (let col = 3; col <= 6; col++) {
              const sumCell = row.getCell(col);
              const value = sumCell.value;
              
              if (typeof value === 'number' && value > 0) {
                totalSum = value;
                break;
              }
            }
          } else {
            // Regular data row
            organizationCount++;
            lastRowWithData = rowNumber;
          }
        }
      }
    });
    
    // If totalSum not found, try common cell locations
    if (!totalSum) {
      const commonSumCells = ['D24', 'E24', 'D25', 'E25', `D${lastRowWithData + 1}`, `E${lastRowWithData + 1}`];
      
      for (const cellRef of commonSumCells) {
        const cell = worksheet.getCell(cellRef);
        if (typeof cell.value === 'number' && cell.value > 0) {
          totalSum = cell.value;
          break;
        }
      }
    }
    
    return { organizationCount, totalSum };
  } catch (error) {
    console.error('Error reading XLSX metadata:', error);
    return { organizationCount: 0, totalSum: null };
  }
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of unifiedCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      unifiedCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes