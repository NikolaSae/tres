// actions/reports/scan-all-reports.ts - OPTIMIZED VERSION
'use server';

import { promises as fs } from 'fs';
import path from 'path';

interface ScannedReport {
  id: string;
  fileName: string;
  filePath: string;
  publicUrl: string;
  organizationName: string;
  shortNumber: string | null;
  month: number;
  year: number;
  paymentType: 'prepaid' | 'postpaid';
  templateType: 'telekom' | 'globaltel' | 'unknown';
  fileSize: number;
  lastModified: Date;
  reportType: 'template' | 'complete' | 'original';
  accountNumber?: number | null;
  totalSum?: number | null;
}

interface ScanResult {
  success: boolean;
  reports: ScannedReport[];
  totalFiles: number;
  organizations: string[];
  error?: string;
}

// Cache for Excel data to avoid re-reading same files
const excelDataCache = new Map<string, { accountNumber: number | null; totalSum: number | null; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Quick file type detection patterns
const FILE_PATTERNS = {
  template: /template/i,
  complete: /complete/i,
  original: /^(?!.*(?:template|complete))/i
};

const TELEKOM_PATTERNS = [/telekom/i, /mts/i];
const GLOBALTEL_PATTERNS = [/globaltel/i, /telenor/i];

export async function scanAllReports(): Promise<ScanResult> {
  const startTime = Date.now();
  console.log('Starting optimized report scan...');

  try {
    const reportsPath = path.join(process.cwd(), 'public', 'reports');
    
    try {
      await fs.access(reportsPath);
    } catch {
      return {
        success: false,
        reports: [],
        totalFiles: 0,
        organizations: [],
        error: 'Reports directory not found'
      };
    }

    const reports = await scanDirectory(reportsPath);
    const organizations = [...new Set(reports.map(r => r.organizationName))].sort();

    console.log(`Scan completed in ${Date.now() - startTime}ms. Found ${reports.length} reports from ${organizations.length} organizations.`);

    return {
      success: true,
      reports,
      totalFiles: reports.length,
      organizations
    };
  } catch (error) {
    console.error('Error scanning reports:', error);
    return {
      success: false,
      reports: [],
      totalFiles: 0,
      organizations: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

async function scanDirectory(dirPath: string): Promise<ScannedReport[]> {
  const reports: ScannedReport[] = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    // Process directories in parallel for better performance
    const directoryPromises = entries
      .filter(entry => entry.isDirectory())
      .map(async (entry) => {
        const orgPath = path.join(dirPath, entry.name);
        console.log(`Scanning organization: ${entry.name}`);
        return await scanOrganizationDirectory(orgPath, entry.name);
      });
    
    const organizationResults = await Promise.all(directoryPromises);
    
    // Flatten results
    for (const orgReports of organizationResults) {
      reports.push(...orgReports);
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }
  
  return reports;
}

async function scanOrganizationDirectory(orgPath: string, orgName: string): Promise<ScannedReport[]> {
  const reports: ScannedReport[] = [];
  
  try {
    const yearDirs = await fs.readdir(orgPath, { withFileTypes: true });
    
    for (const yearDir of yearDirs.filter(d => d.isDirectory())) {
      const yearPath = path.join(orgPath, yearDir.name);
      const year = parseInt(yearDir.name);
      
      if (isNaN(year)) continue;
      
      try {
        const monthDirs = await fs.readdir(yearPath, { withFileTypes: true });
        
        for (const monthDir of monthDirs.filter(d => d.isDirectory())) {
          const monthPath = path.join(yearPath, monthDir.name);
          const month = parseInt(monthDir.name);
          
          if (isNaN(month) || month < 1 || month > 12) continue;
          
          try {
            const paymentTypeDirs = await fs.readdir(monthPath, { withFileTypes: true });
            
            for (const paymentTypeDir of paymentTypeDirs.filter(d => d.isDirectory())) {
              const paymentType = paymentTypeDir.name as 'prepaid' | 'postpaid';
              if (!['prepaid', 'postpaid'].includes(paymentType)) continue;
              
              const paymentTypePath = path.join(monthPath, paymentTypeDir.name);
              const fileReports = await scanFilesInDirectory(
                paymentTypePath, 
                orgName, 
                year, 
                month, 
                paymentType
              );
              reports.push(...fileReports);
            }
          } catch (error) {
            console.error(`Error scanning month directory ${monthPath}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error scanning year directory ${yearPath}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error scanning organization directory ${orgPath}:`, error);
  }
  
  return reports;
}

async function scanFilesInDirectory(
  dirPath: string,
  orgName: string,
  year: number,
  month: number,
  paymentType: 'prepaid' | 'postpaid'
): Promise<ScannedReport[]> {
  const reports: ScannedReport[] = [];
  
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    
    // Process files in smaller batches to avoid overwhelming Excel reading
    const excelFiles = files.filter(file => 
      file.isFile() && 
      (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls'))
    );
    
    // Process files sequentially to avoid memory issues
    for (const file of excelFiles) {
      try {
        const filePath = path.join(dirPath, file.name);
        const stat = await fs.stat(filePath);
        
        const report = await createReportFromFile(
          filePath,
          file.name,
          orgName,
          year,
          month,
          paymentType,
          stat
        );
        
        if (report) {
          reports.push(report);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return reports;
}

async function createReportFromFile(
  filePath: string,
  fileName: string,
  orgName: string,
  year: number,
  month: number,
  paymentType: 'prepaid' | 'postpaid',
  stat: any
): Promise<ScannedReport | null> {
  try {
    // Extract short number from organization name
    const shortNumber = extractShortNumber(orgName);
    
    // Determine template type from filename
    const templateType = determineTemplateType(fileName);
    
    // Determine report type from filename
    const reportType = determineReportType(fileName);
    
    // Create public URL
    const relativePath = path.relative(path.join(process.cwd(), 'public'), filePath);
    const publicUrl = '/' + relativePath.replace(/\\/g, '/');
    
    // Get Excel data with caching and conditional reading
    const excelData = await getExcelDataOptimized(filePath, fileName, stat.mtime, reportType);
    
    return {
      id: `${shortNumber || 'unknown'}-${year}-${month}-${paymentType}-${fileName}`,
      fileName,
      filePath,
      publicUrl,
      organizationName: orgName,
      shortNumber,
      month,
      year,
      paymentType,
      templateType,
      fileSize: stat.size,
      lastModified: stat.mtime,
      reportType,
      accountNumber: excelData.accountNumber,
      totalSum: excelData.totalSum
    };
  } catch (error) {
    console.error(`Error creating report object for ${fileName}:`, error);
    return null;
  }
}

function extractShortNumber(orgName: string): string | null {
  const match = orgName.match(/^(\d+)/);
  return match ? match[1] : null;
}

function determineTemplateType(fileName: string): 'telekom' | 'globaltel' | 'unknown' {
  const lowerFileName = fileName.toLowerCase();
  
  if (TELEKOM_PATTERNS.some(pattern => pattern.test(lowerFileName))) {
    return 'telekom';
  }
  
  if (GLOBALTEL_PATTERNS.some(pattern => pattern.test(lowerFileName))) {
    return 'globaltel';
  }
  
  return 'unknown';
}

function determineReportType(fileName: string): 'template' | 'complete' | 'original' {
  const lowerFileName = fileName.toLowerCase();
  
  if (FILE_PATTERNS.template.test(lowerFileName)) {
    return 'template';
  }
  
  if (FILE_PATTERNS.complete.test(lowerFileName)) {
    return 'complete';
  }
  
  return 'original';
}

// OPTIMIZED: Only read Excel data when necessary and cache results
async function getExcelDataOptimized(
  filePath: string, 
  fileName: string, 
  lastModified: Date,
  reportType: 'template' | 'complete' | 'original'
): Promise<{ accountNumber: number | null; totalSum: number | null }> {
  // Skip Excel reading for original reports or use lightweight approach
  if (reportType === 'original') {
    return { accountNumber: null, totalSum: null };
  }
  
  const cacheKey = filePath;
  const now = Date.now();
  const fileTimestamp = lastModified.getTime();
  
  // Check cache first
  const cached = excelDataCache.get(cacheKey);
  if (cached && (now - cached.timestamp < CACHE_TTL) && cached.timestamp >= fileTimestamp) {
    return { accountNumber: cached.accountNumber, totalSum: cached.totalSum };
  }
  
  // For performance, only read complete reports and templates
  if (reportType === 'complete' || reportType === 'template') {
    try {
      const data = await readExcelDataFast(filePath);
      
      // Cache the result
      excelDataCache.set(cacheKey, {
        accountNumber: data.accountNumber,
        totalSum: data.totalSum,
        timestamp: now
      });
      
      return data;
    } catch (error) {
      console.log(`Failed to read Excel data from ${fileName}:`, error);
      return { accountNumber: null, totalSum: null };
    }
  }
  
  return { accountNumber: null, totalSum: null };
}

// FAST Excel reading - only read specific cells we need
async function readExcelDataFast(filePath: string): Promise<{ accountNumber: number | null; totalSum: number | null }> {
  try {
    const isXls = filePath.toLowerCase().endsWith('.xls');
    
    if (isXls) {
      return await readXlsDataFast(filePath);
    } else {
      return await readXlsxDataFast(filePath);
    }
  } catch (error) {
    console.error('Error reading Excel data:', error);
    return { accountNumber: null, totalSum: null };
  }
}

async function readXlsDataFast(filePath: string): Promise<{ accountNumber: number | null; totalSum: number | null }> {
  try {
    const XLSX = await import('xlsx');
    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { 
      type: 'buffer',
      cellText: false,
      cellNF: false,
      cellHTML: false,
      raw: true,
      sheetRows: 50 // Limit rows read for performance
    });
    
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!worksheet) return { accountNumber: null, totalSum: null };
    
    // Try to read D18 (accountNumber) and D24 (totalSum)
    const accountNumber = worksheet['D18']?.v || null;
    const totalSum = worksheet['D24']?.v || null;
    
    return {
      accountNumber: typeof accountNumber === 'number' ? accountNumber : (accountNumber ? parseFloat(accountNumber) || null : null),
      totalSum: typeof totalSum === 'number' ? totalSum : (totalSum ? parseFloat(totalSum) || null : null)
    };
  } catch (error) {
    console.error('Error reading XLS file:', error);
    return { accountNumber: null, totalSum: null };
  }
}

async function readXlsxDataFast(filePath: string): Promise<{ accountNumber: number | null; totalSum: number | null }> {
  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    
    // Read only the first worksheet for performance
    const worksheetReader = workbook.xlsx.createInputStream();
    const fileStream = await fs.open(filePath, 'r');
    const stream = fileStream.createReadStream();
    
    await new Promise((resolve, reject) => {
      worksheetReader.read(stream)
        .then(() => resolve(void 0))
        .catch(reject);
    });
    
    await fileStream.close();
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) return { accountNumber: null, totalSum: null };
    
    // Read specific cells
    const d18Cell = worksheet.getCell('D18');
    const d24Cell = worksheet.getCell('D24');
    
    const accountNumber = d18Cell.value;
    const totalSum = d24Cell.value;
    
    return {
      accountNumber: typeof accountNumber === 'number' ? accountNumber : (accountNumber ? parseFloat(accountNumber.toString()) || null : null),
      totalSum: typeof totalSum === 'number' ? totalSum : (totalSum ? parseFloat(totalSum.toString()) || null : null)
    };
  } catch (error) {
    // Fallback to basic ExcelJS reading
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) return { accountNumber: null, totalSum: null };
      
      const accountNumber = worksheet.getCell('D18').value;
      const totalSum = worksheet.getCell('D24').value;
      
      return {
        accountNumber: typeof accountNumber === 'number' ? accountNumber : (accountNumber ? parseFloat(accountNumber.toString()) || null : null),
        totalSum: typeof totalSum === 'number' ? totalSum : (totalSum ? parseFloat(totalSum.toString()) || null : null)
      };
    } catch (fallbackError) {
      console.error('Error reading XLSX file (fallback):', fallbackError);
      return { accountNumber: null, totalSum: null };
    }
  }
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of excelDataCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      excelDataCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes