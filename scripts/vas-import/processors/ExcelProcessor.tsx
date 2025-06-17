// Path: scripts/vas-import/processors/ExcelProcessor.tsx
import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';
import path from 'path';

interface ParkingRecord {
  parkingServiceId: string;
  serviceId: string;
  date: Date;
  group: string;
  serviceName: string;
  price: number;
  quantity: number;
  amount: number;
}

interface ProcessedSheet {
  name: string;
  records: ParkingRecord[];
  warnings: string[];
}

interface FileProcessResult {
  records: ParkingRecord[];
  parkingServiceId: string;
  providerName: string;
  filename: string;
  userId: string;
  sheetsProcessed: ProcessedSheet[];
  warnings: string[];
}

interface DateComponents {
  year: string;
  month: string;
  day: string;
}

interface ProviderPattern {
  pattern: RegExp;
  name: string;
  transform?: (match: string) => string;
}

interface ProgressCallback {
  onLog?: (message: string, type: 'info' | 'error' | 'success', file?: string) => void;
  onProgress?: (fileName: string, progress: number) => void;
  onFileStatus?: (fileName: string, status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error') => void;
}

export class ExcelProcessor {
  private currentUserId: string;
  private progressCallback?: ProgressCallback;

  private readonly PROVIDER_PATTERNS: ProviderPattern[] = [
    { 
      pattern: /Servis__MicropaymentMerchantReport_SDP_mParking_([A-Za-zđĐčČćĆžŽšŠ]+)(?:_\d+_\d+|_.+?)?__/, 
      name: 'SDP mParking Servis pattern',
      transform: (match) => this.capitalizeWords(match.replace(/_+/g, ' ').trim())
    },
    { 
      pattern: /SDP_mParking_([A-Za-zđĐčČćĆžŽšŠ]+)(?:_\d+_\d+|_.+?)?__/, 
      name: 'SDP mParking city pattern',
      transform: (match) => this.capitalizeWords(match.replace(/_+/g, ' ').trim())
    },
    { 
      pattern: /_mParking_([A-Za-z0-9]+)_\d+__\d+_/, 
      name: 'mParking pattern' 
    },
    { 
      pattern: /Servis__MicropaymentMerchantReport_([A-Za-z0-9]+)__\d+_/, 
      name: 'Servis pattern' 
    },
    { 
      pattern: /Parking_([A-Za-z0-9]+)_\d{8}/, 
      name: 'Parking pattern' 
    },
    { 
      pattern: /^([A-Za-z0-9]+)_mParking_/, 
      name: 'Provider_mParking pattern' 
    },
    { 
      pattern: /^([A-Za-z0-9]+)_Parking_/, 
      name: 'Provider_Parking pattern' 
    },
    { 
      pattern: /^([A-Za-z0-9]+)_Servis_/, 
      name: 'Provider_Servis pattern' 
    }
  ];

  constructor(userId?: string, progressCallback?: ProgressCallback) {
    this.currentUserId = userId || 'system-user';
    this.progressCallback = progressCallback;
  }

  private log(message: string, type: 'info' | 'error' | 'success' = 'info', file?: string): void {
    console.log(`${type.toUpperCase()}: ${message}`);
    this.progressCallback?.onLog?.(message, type, file);
  }

  private updateProgress(fileName: string, progress: number): void {
    this.progressCallback?.onProgress?.(fileName, progress);
  }

  private updateFileStatus(fileName: string, status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'): void {
    this.progressCallback?.onFileStatus?.(fileName, status);
  }

  private capitalizeWords(text: string): string {
    return text.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private sanitizeProviderName(provider: string): string {
    return provider
      .replace(/_+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\d{5,}$/g, '')
      .trim();
  }

  private extractServiceCode(serviceName: string): string | null {
    if (!serviceName) return null;
    const pattern = /(?<!\d)(\d{4})(?!\d)/;
    const match = serviceName.toString().match(pattern);
    return match?.[1] || null;
  }

  public  extractParkingProvider(filename: string): string {
    this.log(`Extracting provider from filename: ${filename}`, 'info');
    
    for (const { pattern, name, transform } of this.PROVIDER_PATTERNS) {
      const match = filename.match(pattern);
      if (match?.[1]) {
        let provider = match[1];
        
        if (transform) {
          provider = transform(provider);
        } else {
          provider = this.sanitizeProviderName(provider);
          provider = this.capitalizeWords(provider);
        }
        
        if (provider.length >= 2) {
          this.log(`Found provider '${provider}' using ${name}`, 'success');
          return provider;
        }
      }
    }
    
    const basename = path.basename(filename, path.extname(filename));
    const parts = basename.split(/[_\-\s]+/);
    
    if (parts.length > 0 && parts[0].length >= 2) {
      const provider = this.capitalizeWords(parts[0]);
      this.log(`Using fallback provider '${provider}' from first part`, 'info');
      return provider;
    }
    
    const fallback = `Unknown_${basename.substring(0, 10)}`;
    this.log(`Using fallback provider '${fallback}'`, 'error');
    return fallback;
  }

  private convertToFloat(val: any): number {
    if (val === null || val === undefined) return 0;
    
    if (typeof val === 'number') return val;
    
    if (typeof val === 'string') {
      let cleaned = val.trim()
        .replace(/[^\d,.-]/g, '')
        .replace(/(\d)\.(\d{3})/g, '$1$2')
        .replace(/,/g, '.');
      
      if (/\(.*\)/.test(val)) cleaned = '-' + cleaned.replace(/[()]/g, '');
      
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    return Number(val) || 0;
  }

  private extractDateComponents(filename: string): DateComponents {
    const dateMatch = filename.match(/_(\d{4})(\d{2})(\d{2})_\d{4}__/);
    if (dateMatch) {
      return {
        year: dateMatch[1],
        month: dateMatch[2],
        day: dateMatch[3]
      };
    }
    
    return {
      year: new Date().getFullYear().toString(),
      month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
      day: '01'
    };
  }

  private extractYearFromFilename(filename: string): string {
    const yearMatch = filename.match(/(\d{4})/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      if (year >= 2000 && year <= new Date().getFullYear() + 1) {
        return year.toString();
      }
    }
    return new Date().getFullYear().toString();
  }

  private extractMonthFromFilename(filename: string): string {
    const monthMatch = filename.match(/_(\d{4})(\d{2})(\d{2})_/);
    if (monthMatch?.[2]) {
      return monthMatch[2];
    }
    return (new Date().getMonth() + 1).toString().padStart(2, '0');
  }

  private validateDateComponents(yearStr: string, monthStr: string, dayStr: string): void {
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    
    if (isNaN(year) || year < 2000 || year > new Date().getFullYear() + 1) {
      throw new Error(`Invalid year: ${yearStr}`);
    }
    
    if (isNaN(month) || month < 1 || month > 12) {
      throw new Error(`Invalid month: ${monthStr}`);
    }
    
    if (isNaN(day) || day < 1 || day > 31) {
      throw new Error(`Invalid day: ${dayStr}`);
    }
  }

  private parseDateFromComponents(yearStr: string, monthStr: string, dayStr: string): Date {
    const year = parseInt(yearStr.replace(/\D/g, ''), 10);
    const month = parseInt(monthStr.replace(/\D/g, ''), 10);
    const day = parseInt(dayStr.replace(/\D/g, ''), 10);

    if (isNaN(year) || year < 2000 || year > 2100) {
      throw new Error(`Invalid year: ${yearStr}`);
    }
    
    if (isNaN(month) || month < 1 || month > 12) {
      throw new Error(`Invalid month: ${monthStr}`);
    }
    
    if (isNaN(day) || day < 1 || day > 31) {
      throw new Error(`Invalid day: ${dayStr}`);
    }

    const date = new Date(Date.UTC(year, month - 1, day));
    
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${year}-${month}-${day}`);
    }
    
    return date;
  }

  private extractDayFromHeader(header: string): string {
    if (!header) return '';
    // Handle multi-line dates: "01.05.\n2025." → "01"
    const firstLine = header.split('\n')[0];
    const dayPart = firstLine.split('.')[0];
    return dayPart.replace(/\D/g, ''); // Extract digits only
  }

  private identifyDateColumns(header: string[]): { columns: string[], startIndex: number } {
    const dateCols: string[] = [];
    let dataStartCol = 0;
    
    for (let i = 0; i < header.length; i++) {
      const colValue = header[i]?.toString().trim();
      if (colValue && /^\d{1,2}\./.test(colValue)) {
        if (dateCols.length === 0) dataStartCol = i;
        dateCols.push(this.extractDayFromHeader(colValue));
      }
    }
    
    if (dateCols.length === 0) {
      const isLastTotal = header[header.length - 1]?.toUpperCase() === 'TOTAL';
      const endIndex = isLastTotal ? header.length - 1 : header.length;
      return {
        columns: header.slice(2, endIndex).map(col => col?.toString() || ''),
        startIndex: 2
      };
    }
    
    return { columns: dateCols, startIndex: dataStartCol };
  }
  
  private isServiceRow = (row: string[]): boolean => {
  // Check if we have at least 4 columns (service name, price, type, and at least one quantity)
  if (row.length < 4) return false;
  
  // Service name should be non-empty
  if (!row[0]?.trim()) return false;
  
  // Price should be a valid number
  const price = this.convertToFloat(row[1]);
  if (isNaN(price) || price <= 0) return false;
  
  // The third column should be "Broj" (case-insensitive)
  if (row[2]?.toLowerCase() !== 'broj') return false;
  
  return true;
}

  async processSheet(
  worksheet: any, 
  sheetName: string, 
  parkingServiceId: string, 
  dateComponents: DateComponents,
  filename: string
): Promise<ProcessedSheet> {
  const warnings: string[] = [];
  const records: ParkingRecord[] = [];

  try {
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      blankrows: false,
      skipHidden: true
    }).filter(row => row.some(cell => cell !== null));

    if (!rows.length) {
      warnings.push(`Sheet ${sheetName} is empty`);
      return { name: sheetName, records: [], warnings };
    }

    const header = rows[0].map((x: any) => x !== null ? String(x).trim() : '');
    const { columns: dateCols, startIndex: dataStartCol } = this.identifyDateColumns(header);

    this.log(`Processing sheet ${sheetName}: found ${dateCols.length} date columns starting at index ${dataStartCol}`, 'info');
    this.log(`Sheet header: ${JSON.stringify(header)}`, 'debug');
    this.log(`First 5 rows: ${JSON.stringify(rows.slice(0, 5))}`, 'debug');

    let i = 1;

    while (i < rows.length) {
      const row = rows[i]?.map((x: any) => x !== null ? String(x).trim() : '') || [];
      
      if (!row.some(cell => cell)) {
        i++;
        continue;
      }

      // 1. Enhanced service row detection
      if (this.isServiceRow(row)) {
        const serviceName = row[0].trim();
        const price = this.convertToFloat(row[1]);
        // Extract quantities from the same row
        const quantityValues = row.slice(dataStartCol, dataStartCol + dateCols.length);

        this.log(`Processing service: ${serviceName}, price: ${price}`, 'info');
        this.log(`Row data: ${JSON.stringify(row)}`, 'debug');

        for (let j = 0; j < dateCols.length; j++) {
          const rawValue = quantityValues[j] || 0;
          const quantity = this.convertToFloat(rawValue);
          const day = dateCols[j] || '';

          if (quantity > 0) {
            try {
              const dayPadded = day.padStart(2, '0');
              const date = this.parseDateFromComponents(dateComponents.year, dateComponents.month, dayPadded);
              
              const amount = quantity * price;
              
              records.push({
                parkingServiceId,
                serviceId: '',
                group: 'prepaid',
                serviceName,
                price,
                date,
                quantity,
                amount
              });

              this.log(
                `Added record: ${serviceName} | ${date.toISOString().split('T')[0]} | ` +
                `Qty: ${quantity} | Raw: ${rawValue} | Day: ${day}`,
                'info'
              );
            } catch (dateError) {
              warnings.push(`Date error: ${dateError.message} for day ${day}`);
            }
          }
        }
      }
      
      i++;
    }

    this.log(`Sheet ${sheetName} processed: ${records.length} records created`, 'success');
    return { name: sheetName, records, warnings };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    this.log(`Error processing sheet ${sheetName}: ${errorMsg}`, 'error');
    return { 
      name: sheetName, 
      records: [], 
      warnings: [`Critical error processing sheet: ${errorMsg}`] 
    };
  }
}

  async processExcelFile(inputFile: string, parkingServiceId: string): Promise<FileProcessResult> {
    const filename = path.basename(inputFile);
    const warnings: string[] = [];
    
    try {
      this.log(`Processing file: ${filename}`, 'info', filename);
      this.updateFileStatus(filename, 'processing');
      this.updateProgress(filename, 10);

      const fileBuffer = await fs.readFile(inputFile);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      const providerName = this.extractParkingProvider(filename);
      const dateComponents = this.extractDateComponents(filename);

      this.log(`Provider: ${providerName}, Date components: ${JSON.stringify(dateComponents)}`, 'info');
      this.updateProgress(filename, 30);

      const sheetsProcessed: ProcessedSheet[] = [];
      const allRecords: ParkingRecord[] = [];

      for (let sheetIdx = 0; sheetIdx < workbook.SheetNames.length; sheetIdx++) {
        const sheetName = workbook.SheetNames[sheetIdx];
        const worksheet = workbook.Sheets[sheetName];
        
        this.log(`Processing sheet: ${sheetName}`, 'info');
        
        const sheetResult = await this.processSheet(
          worksheet, 
          sheetName, 
          parkingServiceId, 
          dateComponents,
          filename
        );

        sheetsProcessed.push(sheetResult);
        allRecords.push(...sheetResult.records);
        warnings.push(...sheetResult.warnings);
      }

      this.log(`Total records from all sheets: ${allRecords.length}`, 'info');
      this.updateProgress(filename, 70);
      
      this.log(`Successfully processed ${allRecords.length} records for provider: ${providerName}`, 'success', filename);

      return {
        records: allRecords,
        parkingServiceId,
        providerName,
        filename,
        userId: this.currentUserId,
        sheetsProcessed,
        warnings
      };
      
    } catch (error) {
      this.log(`Error processing file: ${error}`, 'error', filename);
      this.updateFileStatus(filename, 'error');
      throw error;
    }
  }

  getServiceNamesFromRecords(records: ParkingRecord[]): Set<string> {
    const serviceNames = new Set<string>();
    records.forEach(record => {
      serviceNames.add(record.serviceName);
    });
    return serviceNames;
  }

  assignServiceIds(records: ParkingRecord[], serviceIdMapping: Record<string, string>): void {
    let recordsWithoutServiceId = 0;
    
    for (const record of records) {
      if (serviceIdMapping[record.serviceName]) {
        record.serviceId = serviceIdMapping[record.serviceName];
      } else {
        recordsWithoutServiceId++;
        record.serviceId = 'default-service-id';
      }
    }

    if (recordsWithoutServiceId > 0) {
      this.log(`${recordsWithoutServiceId} records assigned to default service`, 'info');
    }
  }

  extractYearFromFilenamePublic(filename: string): string {
    return this.extractYearFromFilename(filename);
  }
}

export type { ParkingRecord, ProcessedSheet, FileProcessResult, ProgressCallback };