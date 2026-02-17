// lib/humanitarian-report-parser.ts

import * as XLSX from 'xlsx';

interface ParsedReportInfo {
  shortNumber: string | null;
  organizationName: string | null;
  billingType: 'PREPAID' | 'POSTPAID' | null;
  startDate: Date | null;
  endDate: Date | null;
  month: Date | null;
  rawHeader: string;
  rawFileName: string;
}

/**
 * Parse humanitarian report header cell
 * Format: "1733 Udruzenje28Jun - prepaid" or "1733 UDRUZENJE28JUN - postpaid"
 */
export function parseReportHeader(headerText: string): {
  shortNumber: string | null;
  organizationName: string | null;
  billingType: 'PREPAID' | 'POSTPAID' | null;
} {
  if (!headerText || typeof headerText !== 'string') {
    return { shortNumber: null, organizationName: null, billingType: null };
  }

  // Clean up the header text
  const cleaned = headerText.trim();

  // Extract short number (first 4 digits)
  const shortNumberMatch = cleaned.match(/^(\d{4})/);
  const shortNumber = shortNumberMatch ? shortNumberMatch[1] : null;

  // Extract billing type (prepaid or postpaid)
  let billingType: 'PREPAID' | 'POSTPAID' | null = null;
  if (cleaned.toLowerCase().includes('prepaid')) {
    billingType = 'PREPAID';
  } else if (cleaned.toLowerCase().includes('postpaid')) {
    billingType = 'POSTPAID';
  }

  // Extract organization name (between short number and billing type)
  let organizationName: string | null = null;
  
  // Remove short number from start
  let nameText = cleaned.replace(/^\d{4}\s*/, '');
  
  // Remove billing type from end
  nameText = nameText.replace(/\s*-\s*(prepaid|postpaid)\s*$/i, '').trim();
  
  // Clean up organization name
  if (nameText) {
    // Convert to readable format: "Udruzenje28Jun" -> "Udruzenje 28 Jun"
    organizationName = nameText
      .replace(/([a-z])(\d)/gi, '$1 $2')  // Add space between letters and numbers
      .replace(/(\d)([A-Z])/g, '$1 $2')   // Add space between numbers and uppercase
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Add space between consecutive capitals
      .replace(/\s+/g, ' ')  // Normalize multiple spaces
      .trim();
  }

  return {
    shortNumber,
    organizationName,
    billingType,
  };
}

/**
 * Parse filename to extract date range
 * Format: "Servis__MicropaymentMerchantReport_SDP_Humanitarni_1733UDRUZENJE28JUN_1312__20260101_0000__20260131_2359"
 */
export function parseReportFilename(fileName: string): {
  shortNumber: string | null;
  organizationName: string | null;
  startDate: Date | null;
  endDate: Date | null;
  month: Date | null;
} {
  if (!fileName) {
    return { shortNumber: null, organizationName: null, startDate: null, endDate: null, month: null };
  }

  // Extract short number from filename (4 digits after "Humanitarni_")
  const shortNumberMatch = fileName.match(/Humanitarni_(\d{4})/i);
  const shortNumber = shortNumberMatch ? shortNumberMatch[1] : null;

  // Extract organization name from filename
  const orgMatch = fileName.match(/Humanitarni_\d{4}([A-Z0-9]+)/i);
  const organizationName = orgMatch ? orgMatch[1] : null;

  // Extract date range: __20260101_0000__20260131_2359
  const dateRangeMatch = fileName.match(/__(\d{8})_\d{4}__(\d{8})_\d{4}/);
  
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let month: Date | null = null;

  if (dateRangeMatch) {
    const startDateStr = dateRangeMatch[1]; // "20260101"
    const endDateStr = dateRangeMatch[2];   // "20260131"

    // Parse start date: YYYYMMDD
    const startYear = parseInt(startDateStr.substring(0, 4));
    const startMonth = parseInt(startDateStr.substring(4, 6)) - 1; // 0-indexed
    const startDay = parseInt(startDateStr.substring(6, 8));
    startDate = new Date(startYear, startMonth, startDay);

    // Parse end date: YYYYMMDD
    const endYear = parseInt(endDateStr.substring(0, 4));
    const endMonth = parseInt(endDateStr.substring(4, 6)) - 1; // 0-indexed
    const endDay = parseInt(endDateStr.substring(6, 8));
    endDate = new Date(endYear, endMonth, endDay);

    // Month is the start date (first day of the month)
    month = new Date(startYear, startMonth, 1);
  }

  return {
    shortNumber,
    organizationName,
    startDate,
    endDate,
    month,
  };
}

/**
 * Auto-detect all information from Excel file
 */
export async function autoDetectReportInfo(file: File): Promise<ParsedReportInfo> {
  try {
    // Read Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Get 4th sheet (index 3)
    const sheetName = workbook.SheetNames[3];
    
    if (!sheetName) {
      throw new Error('Sheet 4 not found in Excel file');
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    // Get first cell (A1) - the header with short number and org name
    const headerCell = rawData[0]?.[0];
    const headerText = headerCell ? String(headerCell) : '';

    // Parse header
    const headerInfo = parseReportHeader(headerText);

    // Parse filename
    const filenameInfo = parseReportFilename(file.name);

    // Combine information (prefer filename for dates, header for org details)
    return {
      shortNumber: headerInfo.shortNumber || filenameInfo.shortNumber,
      organizationName: headerInfo.organizationName || filenameInfo.organizationName,
      billingType: headerInfo.billingType,
      startDate: filenameInfo.startDate,
      endDate: filenameInfo.endDate,
      month: filenameInfo.month,
      rawHeader: headerText,
      rawFileName: file.name,
    };

  } catch (error) {
    console.error('Error auto-detecting report info:', error);
    throw error;
  }
}

/**
 * Find humanitarian organization by short number
 */
export async function findHumanitarianOrgByShortNumber(shortNumber: string) {
  // This will be replaced with actual database query
  // For now, return a mock function that you'll implement with Prisma
  
  // Example implementation:
  // const org = await db.humanitarianOrg.findFirst({
  //   where: {
  //     shortNumber: shortNumber
  //   },
  //   include: {
  //     contracts: {
  //       where: {
  //         status: {
  //           in: ['ACTIVE', 'RENEWAL_IN_PROGRESS']
  //         },
  //         type: 'HUMANITARIAN'
  //       },
  //       orderBy: {
  //         createdAt: 'desc'
  //       },
  //       take: 1
  //     }
  //   }
  // });
  
  return null; // Replace with actual implementation
}

/**
 * Validate and confirm auto-detected information
 */
export function formatAutoDetectedInfo(info: ParsedReportInfo): string {
  const parts: string[] = [];

  if (info.shortNumber) {
    parts.push(`Kratki broj: ${info.shortNumber}`);
  }

  if (info.organizationName) {
    parts.push(`Organizacija: ${info.organizationName}`);
  }

  if (info.billingType) {
    parts.push(`Tip naplate: ${info.billingType}`);
  }

  if (info.month) {
    const monthName = info.month.toLocaleString('sr-RS', { month: 'long', year: 'numeric' });
    parts.push(`Period: ${monthName}`);
  }

  if (info.startDate && info.endDate) {
    parts.push(
      `Datum: ${info.startDate.toLocaleDateString('sr-RS')} - ${info.endDate.toLocaleDateString('sr-RS')}`
    );
  }

  return parts.join(' | ');
}