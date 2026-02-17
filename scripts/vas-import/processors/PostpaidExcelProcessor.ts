// Path: scripts/vas-import/processors/PostpaidExcelProcessor.ts
import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';
import path from 'path';

interface VasServiceRecord {
  // Mapiranje na VasService model
  proizvod: string;
  mesec_pruzanja_usluge: Date;
  jedinicna_cena: number;
  broj_transakcija: number;
  fakturisan_iznos: number;
  fakturisan_korigovan_iznos: number;
  naplacen_iznos: number;
  kumulativ_naplacenih_iznosa: number;
  nenaplacen_iznos: number;
  nenaplacen_korigovan_iznos: number;
  storniran_iznos: number;
  otkazan_iznos: number;
  kumulativ_otkazanih_iznosa: number;
  iznos_za_prenos_sredstava: number;
  
  // Relations - će biti povezani tokom upisa u bazu
  serviceId: string;
  provajderId: string;
}

interface ProcessedVasServiceSheet {
  name: string;
  records: VasServiceRecord[];
  warnings: string[];
  monthlyTotals: {
    month: string;
    totalTransactions: number;
    totalInvoiced: number;
    totalCollected: number;
    totalUncollected: number;
  }[];
}

interface VasServiceFileProcessResult {
  records: VasServiceRecord[];
  providerName: string;
  contractInfo: string;
  reportPeriod: string;
  filename: string;
  userId: string;
  sheetsProcessed: ProcessedVasServiceSheet[];
  warnings: string[];
}

interface VasServiceProviderPattern {
  pattern: RegExp;
  name: string;
  transform?: (match: string) => string;
}

interface VasServiceProgressCallback {
  onLog?: (message: string, type: 'info' | 'error' | 'success', file?: string) => void;
  onProgress?: (fileName: string, progress: number) => void;
  onFileStatus?: (fileName: string, status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error') => void;
}

export class PostpaidExcelProcessor {
  private currentUserId: string;
  private progressCallback?: VasServiceProgressCallback;

  private readonly PROVIDER_PATTERNS: VasServiceProviderPattern[] = [
    { 
      pattern: /SDP_mParking_([A-Za-zđĐčČćĆžŽšŠ]+)_/, 
      name: 'SDP mParking postpaid pattern',
      transform: (match) => this.capitalizeWords(match.replace(/_+/g, ' ').trim())
    },
    { 
      pattern: /mParking_([A-Za-z0-9]+)_/, 
      name: 'mParking postpaid pattern' 
    },
    { 
      pattern: /Postpaid_([A-Za-z0-9]+)_/, 
      name: 'Postpaid pattern' 
    },
    { 
      pattern: /^([A-Za-z0-9]+)_postpaid_/, 
      name: 'Provider_postpaid pattern' 
    }
  ];

  private readonly VAS_SERVICE_COLUMNS = {
    SERVICE: 0,
    MONTH: 1,
    UNIT_PRICE: 2,
    TRANSACTION_COUNT: 3,
    INVOICED_AMOUNT: 4,
    INVOICED_CORRECTED: 5,
    COLLECTED_AMOUNT: 6,
    CUMULATIVE_COLLECTED: 7,
    UNCOLLECTED_AMOUNT: 8,
    UNCOLLECTED_CORRECTED: 9,
    REVERSED_AMOUNT: 10,
    CANCELED_AMOUNT: 11,
    CUMULATIVE_CANCELED: 12,
    TRANSFER_AMOUNT: 13
  };

  constructor(userId?: string, progressCallback?: VasServiceProgressCallback) {
    this.currentUserId = userId || 'system-user';
    this.progressCallback = progressCallback;
  }

  private log(message: string, type: 'info' | 'error' | 'success' = 'info', file?: string): void {
    console.log(`VAS_SERVICE ${type.toUpperCase()}: ${message}`);
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

  public extractPostpaidProvider(filename: string): string {
    this.log(`Extracting VAS service provider from filename: ${filename}`, 'info');
    
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
          this.log(`Found VAS service provider '${provider}' using ${name}`, 'success');
          return provider;
        }
      }
    }
    
    const basename = path.basename(filename, path.extname(filename));
    const parts = basename.split(/[_\-\s]+/);
    
    if (parts.length > 0 && parts[0].length >= 2) {
      const provider = this.capitalizeWords(parts[0]);
      this.log(`Using fallback VAS service provider '${provider}' from first part`, 'info');
      return provider;
    }
    
    const fallback = `Unknown_VasService_${basename.substring(0, 10)}`;
    this.log(`Using fallback VAS service provider '${fallback}'`, 'error');
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

  private parseServiceMonth(monthString: string): Date {
    if (!monthString || typeof monthString !== 'string') {
      return new Date();
    }
    
    const match = monthString.trim().match(/^(\d{2})\.(\d{4})$/);
    if (match) {
      const month = parseInt(match[1], 10) - 1;
      const year = parseInt(match[2], 10);
      return new Date(year, month, 1);
    }
    
    this.log(`Invalid month format: ${monthString}, using current date`, 'error');
    return new Date();
  }

  private extractContractInfo(rows: any[][]): { provider: string; contract: string; reportPeriod: string } {
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i];
      if (row && row[0]) {
        const headerText = row[0].toString();
        
        const providerMatch = headerText.match(/Ponuđač:\s*([^()]+)\s*\(/);
        const contractMatch = headerText.match(/Ugovor:\s*([^()]*)\s*\(([^)]+)\)/);
        const periodMatch = headerText.match(/(\d+)\.\s*mesecu\s*(\d{4})/);
        
        if (providerMatch || contractMatch || periodMatch) {
          return {
            provider: providerMatch?.[1]?.trim() || 'Unknown Provider',
            contract: contractMatch ? `${contractMatch[1]} (${contractMatch[2]})`.trim() : 'Unknown Contract',
            reportPeriod: periodMatch ? `${periodMatch[1]}.${periodMatch[2]}` : 'Unknown Period'
          };
        }
      }
    }
    
    return {
      provider: 'Unknown Provider',
      contract: 'Unknown Contract',
      reportPeriod: 'Unknown Period'
    };
  }

  private findHeaderRow(rows: any[][]): number {
    for (let i = 0; i < Math.min(20, rows.length); i++) {
      const row = rows[i];
      if (row && row.length > 5) {
        const cellText = row[0]?.toString().toLowerCase() || '';
        if (cellText.includes('proizvod') || 
            cellText.includes('mesec') ||
            (row[1]?.toString().toLowerCase().includes('mesec') && 
             row[2]?.toString().toLowerCase().includes('cena'))) {
          this.log(`Found header row at index ${i}`, 'info');
          return i;
        }
      }
    }
    
    this.log('Header row not found, using default index 0', 'error');
    return -1;
  }

  private isServiceDataRow(row: any[]): boolean {
    if (!row || row.length < 4) return false;
    
    const firstCell = row[0]?.toString().trim() || '';
    const monthCell = row[1]?.toString().trim() || '';
    
    return (
      firstCell.length > 0 && // Has service name
      /^\d{2}\.\d{4}$/.test(monthCell) && // MM.YYYY format
      !isNaN(parseFloat(row[2])) && // Has numeric unit price
      !isNaN(parseFloat(row[3]))    // Has numeric transaction count
    );
  }

  private isMonthlyTotalRow(row: any[]): boolean {
    if (!row || row.length < 2) return false;
    
    const firstCell = row[0]?.toString().trim().toLowerCase() || '';
    return firstCell.includes('ukupno za mesec');
  }

  // ✅ UKLONJEN parkingServiceId parametar
  async processVasServiceSheet(
    worksheet: any, 
    sheetName: string, 
    filename: string,
    defaultServiceId: string = '',
    defaultProviderId: string = ''
  ): Promise<ProcessedVasServiceSheet> {
    const warnings: string[] = [];
    const records: VasServiceRecord[] = [];
    const monthlyTotals: any[] = [];

    try {
      const rows: any[][] = (XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        blankrows: false,
        skipHidden: true
      }) as any[][]).filter((row: any[]) => row.some((cell: any) => cell !== null));

      if (!rows.length) {
        warnings.push(`Sheet ${sheetName} is empty`);
        return { name: sheetName, records: [], warnings: [], monthlyTotals: [] };
      }

      this.log(`Processing ${rows.length} rows in sheet ${sheetName}`, 'info');

      const headerRowIndex = this.findHeaderRow(rows);
      let currentMonth = '';

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i].map((x: any) => (x !== null ? String(x).trim() : ''));
        
        if (this.isServiceDataRow(row)) {
          try {
            const record: VasServiceRecord = {
              proizvod: row[this.VAS_SERVICE_COLUMNS.SERVICE] || '',
              mesec_pruzanja_usluge: this.parseServiceMonth(row[this.VAS_SERVICE_COLUMNS.MONTH] || ''),
              jedinicna_cena: this.convertToFloat(row[this.VAS_SERVICE_COLUMNS.UNIT_PRICE]),
              broj_transakcija: Math.round(this.convertToFloat(row[this.VAS_SERVICE_COLUMNS.TRANSACTION_COUNT])),
              fakturisan_iznos: this.convertToFloat(row[this.VAS_SERVICE_COLUMNS.INVOICED_AMOUNT]),
              fakturisan_korigovan_iznos: this.convertToFloat(row[this.VAS_SERVICE_COLUMNS.INVOICED_CORRECTED]),
              naplacen_iznos: this.convertToFloat(row[this.VAS_SERVICE_COLUMNS.COLLECTED_AMOUNT]),
              kumulativ_naplacenih_iznosa: this.convertToFloat(row[this.VAS_SERVICE_COLUMNS.CUMULATIVE_COLLECTED]),
              nenaplacen_iznos: this.convertToFloat(row[this.VAS_SERVICE_COLUMNS.UNCOLLECTED_AMOUNT]),
              nenaplacen_korigovan_iznos: this.convertToFloat(row[this.VAS_SERVICE_COLUMNS.UNCOLLECTED_CORRECTED]),
              storniran_iznos: this.convertToFloat(row[this.VAS_SERVICE_COLUMNS.REVERSED_AMOUNT]),
              otkazan_iznos: this.convertToFloat(row[this.VAS_SERVICE_COLUMNS.CANCELED_AMOUNT]),
              kumulativ_otkazanih_iznosa: this.convertToFloat(row[this.VAS_SERVICE_COLUMNS.CUMULATIVE_CANCELED]),
              iznos_za_prenos_sredstava: this.convertToFloat(row[this.VAS_SERVICE_COLUMNS.TRANSFER_AMOUNT]),
              
              // Relations - placeholder, biće postavljeni u database operacijama
              serviceId: defaultServiceId,
              provajderId: defaultProviderId
            };

            if (!record.proizvod) {
              warnings.push(`Row ${i + 1}: Missing service name (proizvod)`);
              continue;
            }

            records.push(record);
            currentMonth = row[this.VAS_SERVICE_COLUMNS.MONTH] || '';
            
            this.log(`Added VAS service record: ${record.proizvod} | ${currentMonth} | Transactions: ${record.broj_transakcija}`, 'info');
            
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            warnings.push(`Row ${i + 1}: Error processing service data - ${errorMsg}`);
          }
        } 
        else if (this.isMonthlyTotalRow(row)) {
          if (currentMonth) {
            const monthTotal = {
              month: currentMonth,
              totalTransactions: Math.round(this.convertToFloat(row[this.VAS_SERVICE_COLUMNS.TRANSACTION_COUNT])),
              totalInvoiced: this.convertToFloat(row[this.VAS_SERVICE_COLUMNS.INVOICED_AMOUNT]),
              totalCollected: this.convertToFloat(row[this.VAS_SERVICE_COLUMNS.COLLECTED_AMOUNT]),
              totalUncollected: this.convertToFloat(row[this.VAS_SERVICE_COLUMNS.UNCOLLECTED_AMOUNT])
            };
            monthlyTotals.push(monthTotal);
            this.log(`Added monthly total for ${currentMonth}: ${monthTotal.totalTransactions} transactions`, 'info');
          }
        }
      }

      this.log(`Processed ${records.length} VAS service records in sheet ${sheetName}`, 'success');
      return { name: sheetName, records, warnings, monthlyTotals };
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log(`Critical error processing VAS service sheet ${sheetName}: ${errorMsg}`, 'error');
      return { 
        name: sheetName, 
        records: [], 
        warnings: [`Critical error: ${errorMsg}`],
        monthlyTotals: []
      };
    }
  }

  // ✅ UKLONJEN parkingServiceId parametar i validacija
  async processPostpaidExcelFile(
    inputFile: string,
    outputDir?: string,
    outputFormat: 'json' | 'csv' | 'xlsx' = 'json'
  ): Promise<VasServiceFileProcessResult> {
    const filename = path.basename(inputFile);
    const warnings: string[] = [];
    
    try {
      this.log(`Processing VAS service file: ${filename}`, 'info', filename);
      this.updateFileStatus(filename, 'processing');
      this.updateProgress(filename, 10);
      
      const fileBuffer = await fs.readFile(inputFile);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      this.updateProgress(filename, 30);

      const sheetsProcessed: ProcessedVasServiceSheet[] = [];
      const allRecords: VasServiceRecord[] = [];
      let contractInfo = { provider: '', contract: '', reportPeriod: '' };

      // Process first sheet to extract contract info
      if (workbook.SheetNames.length > 0) {
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const firstSheetRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        contractInfo = this.extractContractInfo(firstSheetRows as any[][]);
      }

      for (let sheetIdx = 0; sheetIdx < workbook.SheetNames.length; sheetIdx++) {
        const sheetName = workbook.SheetNames[sheetIdx];
        const worksheet = workbook.Sheets[sheetName];
        
        this.log(`Processing VAS service sheet: ${sheetName}`, 'info');
        
        // ✅ UKLONJEN parkingServiceId argument
        const sheetResult = await this.processVasServiceSheet(
          worksheet, 
          sheetName, 
          filename
        );

        sheetsProcessed.push(sheetResult);
        allRecords.push(...sheetResult.records);
        warnings.push(...sheetResult.warnings);
      }

      this.log(`Total VAS service records from all sheets: ${allRecords.length}`, 'info');
      this.updateProgress(filename, 70);
      
      const result: VasServiceFileProcessResult = {
        records: allRecords,
        providerName: contractInfo.provider || this.extractPostpaidProvider(filename),
        contractInfo: contractInfo.contract,
        reportPeriod: contractInfo.reportPeriod,
        filename,
        userId: this.currentUserId,
        sheetsProcessed,
        warnings
      };
      
      // Save processed data if output directory is provided
      if (outputDir) {
        await this.saveVasServiceProcessedData(result, outputFormat);
      }

      this.log(`Successfully processed ${allRecords.length} VAS service records for provider: ${result.providerName}`, 'success', filename);
      this.updateFileStatus(filename, 'completed');
      this.updateProgress(filename, 100);
      
      return result;
      
    } catch (error) {
      this.log(`Error processing VAS service file: ${error}`, 'error', filename);
      this.updateFileStatus(filename, 'error');
      throw error;
    }
  }

  private async saveVasServiceProcessedData(
    result: VasServiceFileProcessResult,
    outputFormat: 'json' | 'csv' | 'xlsx' = 'json'
  ): Promise<string> {
    try {
      const sanitizedProviderName = result.providerName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
      const reportYear = result.reportPeriod.split('.')[1] || new Date().getFullYear().toString();
      
      const outputDir = path.join(
        'public',
        'vas-services',
        sanitizedProviderName,
        'reports',
        reportYear
      );
      
      await fs.mkdir(outputDir, { recursive: true });
      
      const baseName = path.basename(result.filename, path.extname(result.filename));
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputPath = path.join(outputDir, `${baseName}_${timestamp}_vas_service.${outputFormat}`);
      
      switch (outputFormat) {
        case 'json':
          await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
          break;
          
        case 'csv':
          const csvContent = [
            'proizvod,mesec_pruzanja_usluge,jedinicna_cena,broj_transakcija,fakturisan_iznos,naplacen_iznos,nenaplacen_iznos,iznos_za_prenos_sredstava',
            ...result.records.map(r => 
              `"${r.proizvod}","${r.mesec_pruzanja_usluge.toISOString()}",${r.jedinicna_cena},${r.broj_transakcija},${r.fakturisan_iznos},${r.naplacen_iznos},${r.nenaplacen_iznos},${r.iznos_za_prenos_sredstava}`
            )
          ].join('\n');
          await fs.writeFile(outputPath, csvContent);
          break;
          
        case 'xlsx':
          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(result.records);
          XLSX.utils.book_append_sheet(wb, ws, 'VasServiceData');
          XLSX.writeFile(wb, outputPath);
          break;
      }
      
      this.log(`Successfully saved VAS service processed data to ${outputPath}`, 'success', result.filename);
      return outputPath;
      
    } catch (error) {
      const errorMsg = `Save failed: ${error instanceof Error ? error.message : String(error)}`;
      this.log(errorMsg, 'error', result.filename);
      throw new Error(errorMsg);
    }
  }

  getVasServiceNamesFromRecords(records: VasServiceRecord[]): Set<string> {
    const serviceNames = new Set<string>();
    records.forEach(record => {
      serviceNames.add(record.proizvod);
    });
    return serviceNames;
  }

  assignVasServiceIds(records: VasServiceRecord[], serviceIdMapping: Record<string, string>): void {
    let recordsWithoutServiceId = 0;
    
    for (const record of records) {
      if (serviceIdMapping[record.proizvod]) {
        record.serviceId = serviceIdMapping[record.proizvod];
      } else {
        recordsWithoutServiceId++;
        record.serviceId = 'default-service-id';
      }
    }

    if (recordsWithoutServiceId > 0) {
      this.log(`${recordsWithoutServiceId} VAS service records assigned to default service`, 'info');
    }
  }
}

export type { 
  VasServiceRecord, 
  ProcessedVasServiceSheet, 
  VasServiceFileProcessResult, 
  VasServiceProgressCallback 
};