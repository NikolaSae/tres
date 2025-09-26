// actions/reports/scan-all-reports.ts
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

export interface ScannedReport {
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
  // New fields for account number (D18) and sum (D24)
  accountNumber?: number | null;
  totalSum?: number | null;
}

export interface ScanResult {
  success: boolean;
  reports: ScannedReport[];
  totalFiles: number;
  organizations: string[];
  error?: string;
}

const REPORTS_BASE_PATH = path.join(process.cwd(), 'public', 'reports');

export async function scanAllReports(): Promise<ScanResult> {
  try {
    console.log('Starting report scan...');
    
    // Check if reports directory exists
    try {
      await fs.access(REPORTS_BASE_PATH);
    } catch (error) {
      return {
        success: false,
        reports: [],
        totalFiles: 0,
        organizations: [],
        error: 'Reports directory not found'
      };
    }

    const reports: ScannedReport[] = [];
    const organizationsSet = new Set<string>();

    // Get all organization folders
    const organizationFolders = await fs.readdir(REPORTS_BASE_PATH, { withFileTypes: true });
    
    for (const orgFolder of organizationFolders) {
      if (!orgFolder.isDirectory()) continue;

      const orgFolderName = orgFolder.name;
      console.log(`Scanning organization: ${orgFolderName}`);
      
      // Parse organization info from folder name (format: "shortNumber - organizationName")
      const orgNameMatch = orgFolderName.match(/^(\d+)\s*-\s*(.+)$/);
      const shortNumber = orgNameMatch ? orgNameMatch[1] : null;
      const organizationName = orgNameMatch ? orgNameMatch[2].trim() : orgFolderName;
      
      organizationsSet.add(organizationName);

      const orgPath = path.join(REPORTS_BASE_PATH, orgFolderName);
      
      try {
        // Get year folders
        const yearFolders = await fs.readdir(orgPath, { withFileTypes: true });
        
        for (const yearFolder of yearFolders) {
          if (!yearFolder.isDirectory()) continue;
          
          const year = parseInt(yearFolder.name);
          if (isNaN(year)) continue;

          const yearPath = path.join(orgPath, yearFolder.name);
          
          try {
            // Get month folders
            const monthFolders = await fs.readdir(yearPath, { withFileTypes: true });
            
            for (const monthFolder of monthFolders) {
              if (!monthFolder.isDirectory()) continue;
              
              const month = parseInt(monthFolder.name);
              if (isNaN(month) || month < 1 || month > 12) continue;

              const monthPath = path.join(yearPath, monthFolder.name);
              
              try {
                // Get payment type folders or files directly
                const items = await fs.readdir(monthPath, { withFileTypes: true });
                
                for (const item of items) {
                  if (item.isDirectory()) {
                    // Payment type folder (prepaid/postpaid)
                    const paymentType = item.name as 'prepaid' | 'postpaid';
                    if (paymentType !== 'prepaid' && paymentType !== 'postpaid') continue;

                    const paymentTypePath = path.join(monthPath, item.name);
                    
                    try {
                      const files = await fs.readdir(paymentTypePath, { withFileTypes: true });
                      
                      for (const file of files) {
                        if (file.isFile() && (
                          file.name.toLowerCase().endsWith('.xlsx') || 
                          file.name.toLowerCase().endsWith('.xls') ||
                          file.name.toLowerCase().endsWith('.json')
                        )) {
                          const report = await createScannedReport(
                            file.name,
                            path.join(paymentTypePath, file.name),
                            organizationName,
                            shortNumber,
                            month,
                            year,
                            paymentType,
                            orgFolderName
                          );
                          if (report) reports.push(report);
                        }
                      }
                    } catch (error) {
                      console.error(`Error reading payment type folder ${paymentTypePath}:`, error);
                    }
                  } else if (item.isFile() && (
                    item.name.toLowerCase().endsWith('.xlsx') || 
                    item.name.toLowerCase().endsWith('.xls') ||
                    item.name.toLowerCase().endsWith('.json')
                  )) {
                    // File directly in month folder (legacy structure)
                    const report = await createScannedReport(
                      item.name,
                      path.join(monthPath, item.name),
                      organizationName,
                      shortNumber,
                      month,
                      year,
                      'unknown' as any,
                      orgFolderName
                    );
                    if (report) reports.push(report);
                  }
                }
              } catch (error) {
                console.error(`Error reading month folder ${monthPath}:`, error);
              }
            }
          } catch (error) {
            console.error(`Error reading year folder ${yearPath}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error reading organization folder ${orgPath}:`, error);
      }
    }

    console.log(`Scan completed. Found ${reports.length} reports from ${organizationsSet.size} organizations.`);

    return {
      success: true,
      reports: reports.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()),
      totalFiles: reports.length,
      organizations: Array.from(organizationsSet).sort(),
    };
  } catch (error) {
    console.error('Error scanning reports:', error);
    return {
      success: false,
      reports: [],
      totalFiles: 0,
      organizations: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract data from Excel file cells D18 and D24
 */
async function extractExcelData(filePath: string): Promise<{ accountNumber?: number | null; totalSum?: number | null }> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // Get the first worksheet
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];
    
    // Extract account number from D18
    let accountNumber: number | null = null;
    const d18Cell = worksheet['D18'];
    if (d18Cell && d18Cell.v !== undefined) {
      const value = d18Cell.v;
      if (typeof value === 'number') {
        accountNumber = Math.round(value);
      } else if (typeof value === 'string') {
        const parsed = parseInt(value.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed)) {
          accountNumber = parsed;
        }
      }
    }
    
    // Extract total sum from D24
    let totalSum: number | null = null;
    const d24Cell = worksheet['D24'];
    if (d24Cell && d24Cell.v !== undefined) {
      const value = d24Cell.v;
      if (typeof value === 'number') {
        totalSum = value;
      } else if (typeof value === 'string') {
        // Try to parse string as number, removing any non-numeric characters except decimal points
        const cleanValue = value.replace(/[^\d.-]/g, '');
        const parsed = parseFloat(cleanValue);
        if (!isNaN(parsed)) {
          totalSum = parsed;
        }
      }
    }
    
    return { accountNumber, totalSum };
  } catch (error) {
    console.warn(`Failed to extract Excel data from ${filePath}:`, error);
    return { accountNumber: null, totalSum: null };
  }
}

async function createScannedReport(
  fileName: string,
  filePath: string,
  organizationName: string,
  shortNumber: string | null,
  month: number,
  year: number,
  paymentType: 'prepaid' | 'postpaid' | 'unknown',
  orgFolderName: string
): Promise<ScannedReport | null> {
  try {
    const stats = await fs.stat(filePath);
    
    // Determine template type from filename
    let templateType: 'telekom' | 'globaltel' | 'unknown' = 'unknown';
    const lowerFileName = fileName.toLowerCase();
    if (lowerFileName.includes('telekom')) {
      templateType = 'telekom';
    } else if (lowerFileName.includes('globaltel')) {
      templateType = 'globaltel';
    }

    // Determine report type from filename
    let reportType: 'template' | 'complete' | 'original' = 'original';
    if (lowerFileName.includes('template')) {
      reportType = 'template';
    } else if (lowerFileName.includes('complete')) {
      reportType = 'complete';
    }

    // Create public URL
    const relativePath = path.relative(path.join(process.cwd(), 'public'), filePath);
    const publicUrl = `/${relativePath.replace(/\\/g, '/')}`;

    // Extract Excel data if it's an Excel file
    let excelData: { accountNumber?: number | null; totalSum?: number | null } = {
      accountNumber: null,
      totalSum: null
    };
    
    if (lowerFileName.endsWith('.xlsx') || lowerFileName.endsWith('.xls')) {
      excelData = await extractExcelData(filePath);
    }

    const report: ScannedReport = {
      id: `${orgFolderName}-${year}-${month}-${paymentType}-${fileName}`,
      fileName,
      filePath,
      publicUrl,
      organizationName,
      shortNumber,
      month,
      year,
      paymentType: paymentType === 'unknown' ? 'prepaid' : paymentType,
      templateType,
      fileSize: stats.size,
      lastModified: stats.mtime,
      reportType,
      accountNumber: excelData.accountNumber,
      totalSum: excelData.totalSum
    };

    return report;
  } catch (error) {
    console.error(`Error creating report info for ${fileName}:`, error);
    return null;
  }
}