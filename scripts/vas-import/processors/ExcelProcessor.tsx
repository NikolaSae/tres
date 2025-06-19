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

  private parseDate(year: string, month: string, day: string): Date {
  // Handle different date formats
  const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  const date = new Date(dateStr);
  
  // Validate date
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${year}-${month}-${day}`);
  }
  
  // Ensure date components match
  if (date.getUTCFullYear() !== parseInt(year) || 
      date.getUTCMonth() + 1 !== parseInt(month) ||
      date.getUTCDate() !== parseInt(day)) {
    throw new Error(`Date components don't match: ${year}-${month}-${day}`);
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
  let dataStartCol = 3; // Fixed start index for your format
  
  for (let i = dataStartCol; i < header.length; i++) {
    const colValue = header[i]?.toString().trim() || '';
    
    // Handle multi-line dates like "01.05.\n2025."
    const dayMatch = colValue.match(/^(\d{1,2})\./);
    if (dayMatch) {
      dateCols.push(dayMatch[1]);
    }
    // Stop at "TOTAL" column
    else if (colValue === 'TOTAL') {
      break;
    }
    // Fallback: look for any numeric-looking header
    else if (/^\d+$/.test(colValue)) {
      dateCols.push(colValue);
    }
  }
  
  return { columns: dateCols, startIndex: dataStartCol };
}
  
  private isServiceRow = (row: string[]): boolean => {
  if (row.length < 4) return false;
  if (!row[0]?.trim()) return false;
  
  const price = this.convertToFloat(row[1]);
  if (isNaN(price) || price <= 0) return false;
  
  // More flexible header detection
  const thirdCol = row[2]?.toLowerCase() || '';
  return (
    thirdCol.includes('broj') ||    // Croatian
    thirdCol.includes('quantity') || // English
    thirdCol.includes('količina')   // Slovenian
  );
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
  let inPrepaidSection = false;

  try {
    // Read and filter rows
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

    // 1. EXTRACT DATE COLUMNS FROM FIRST ROW
    const dateRow = rows[0];
    const dateCols: string[] = [];
    let dataStartCol = 3; // Column D is index 3
    
    for (let col = dataStartCol; col < dateRow.length; col++) {
      const cellValue = dateRow[col]?.toString().trim() || '';
      if (cellValue === 'TOTAL') break;
      
      // Extract day from formats like "01.05.\n2025."
      const dayMatch = cellValue.match(/^(\d{1,2})\./);
      if (dayMatch && dayMatch[1]) {
        dateCols.push(dayMatch[1]);
      }
    }

    this.log(`Found ${dateCols.length} date columns in sheet ${sheetName}`, 'info');

    // 2. PROCESS ROWS
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i].map((x: any) => (x !== null ? String(x).trim() : ''));
      if (row.length === 0) continue;

      const firstCell = row[0]?.toString().trim() || '';
      
      // 3. SECTION DETECTION
      if (firstCell.toLowerCase().endsWith('- prepaid')) {
        inPrepaidSection = true;
        this.log(`Entered prepaid section: ${firstCell}`, 'info');
        continue; // Skip section header row
      } 
      else if (firstCell.toLowerCase().endsWith('- postpaid')) {
        inPrepaidSection = false;
        this.log(`Exiting prepaid section: ${firstCell}`, 'info');
        continue; // Skip section header row
      }
      else if (firstCell.toLowerCase().endsWith('- total')) {
        inPrepaidSection = false;
        continue; // Skip section header row
      }

      // 4. ONLY PROCESS PREPAID SECTIONS
      if (!inPrepaidSection) continue;

      // 5. SERVICE ROW DETECTION - PRECISE MATCHING
      const isServiceRow = (
        firstCell.startsWith('S_') && 
        row.length > 2 && 
        row[2] === 'Broj' &&
        !isNaN(parseFloat(row[1]))
      );

      if (isServiceRow) {
        const serviceName = firstCell;
        const price = this.convertToFloat(row[1]);
        this.log(`Processing service row: ${serviceName}`, 'debug');

        // 6. GET AMOUNT ROW (NEXT ROW)
        if (i + 1 >= rows.length) {
          warnings.push(`Missing amount row for service ${serviceName}`);
          continue;
        }

        const amountRow = rows[i + 1].map((x: any) => (x !== null ? String(x).trim() : ''));
        
        // 7. VERIFY AMOUNT ROW TYPE
        const isAmountRow = amountRow[2] === 'Iznos';
        if (!isAmountRow) {
          warnings.push(`Missing amount row (Iznos) for service ${serviceName}`);
          continue;
        }

        // 8. PROCESS EACH DAY
        for (let j = 0; j < dateCols.length; j++) {
          const colIndex = dataStartCol + j;
          const day = dateCols[j];
          
          // Skip if no data columns
          if (colIndex >= row.length || colIndex >= amountRow.length) {
            continue;
          }

          const quantity = this.convertToFloat(row[colIndex] || '0');
          const amount = this.convertToFloat(amountRow[colIndex] || '0');

          if (quantity > 0) {
            try {
              // Pad single-digit days
              const paddedDay = day.padStart(2, '0');
              const date = new Date(
                Date.UTC(
                  parseInt(dateComponents.year), 
                  parseInt(dateComponents.month) - 1, 
                  parseInt(paddedDay)
                )
              );
              
              // Validate date
              if (isNaN(date.getTime())) {
                throw new Error(`Invalid date: ${dateComponents.year}-${dateComponents.month}-${paddedDay}`);
              }

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
              
              this.log(`Added record: ${serviceName} | ${date.toISOString().split('T')[0]} | Qty: ${quantity}`, 'debug');
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : String(error);
              warnings.push(`Date error for ${serviceName} on day ${day}: ${errorMsg}`);
            }
          }
        }
        
        i++; // Skip the amount row
      }
    }

    this.log(`Processed ${records.length} prepaid records in sheet ${sheetName}`, 'success');
    return { name: sheetName, records, warnings };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    this.log(`Critical error processing sheet ${sheetName}: ${errorMsg}`, 'error');
    return { 
      name: sheetName, 
      records: [], 
      warnings: [`Critical error: ${errorMsg}`] 
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