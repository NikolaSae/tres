// actions/reports/generate-humanitarian-templates.ts - FINALNA ISPRAVLJENA VERZIJA © 2025
'use server';
import 'server-only';

import { db } from "@/lib/db";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { generateOrganizationFolderName } from "@/utils/report-path";
import { buildReportPath } from '@/lib/server-path-utils';

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
  pib: string | null;
  registrationNumber: string | null;
  shortNumber: string | null;
  activeContract: {
    name: string;
    contractNumber?: string;
    startDate?: Date;
    endDate?: Date;
  } | null;
}

type PaymentType = 'prepaid' | 'postpaid';
type TemplateType = 'telekom' | 'globaltel';

// ✅ Runtime path construction - sakriveno od Turbopack static analysis
const getTemplatesPath = async () => {
  const path = await import('path');
  return path.join(process.cwd(), 'templates');
};

const getReportsBasePath = async () => {
  const path = await import('path');
  return path.join(process.cwd(), 'reports');
};

const getOriginalReportsPath = async () => {
  const path = await import('path');
  return path.join(process.cwd(), 'public', 'reports');
};

// ============================================
// PRAVI THREAD-SAFE GLOBALNI COUNTER (file locking)
// ============================================

class GlobalCounterManager {
  private static locks = new Map<string, { promise: Promise<void>; resolve: () => void }>();

  private static getLockKey(month: number, year: number): string {
    return `${year}-${month.toString().padStart(2, '0')}`;
  }

  static async incrementIfValid(
    month: number,
    year: number,
    reportValue: number,
    organizationName: string
  ): Promise<number | null> {
    if (reportValue <= 0) {
      console.log(`⚪ ${organizationName}: reportValue = ${reportValue} → counter se NE dodeljuje`);
      return null;
    }

    const lockKey = this.getLockKey(month, year);

    // Čekamo da se oslobodi prethodni lock (ako postoji)
    while (this.locks.has(lockKey)) {
      await this.locks.get(lockKey)!.promise;
    }

    // Kreiramo novi lock
    let resolveLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });

    this.locks.set(lockKey, { promise: lockPromise, resolve: resolveLock! });

    try {
      const result = await this._performIncrement(month, year, reportValue, organizationName);
      return result;
    } finally {
      // Uvek oslobodimo lock
      this.locks.get(lockKey)?.resolve();
      this.locks.delete(lockKey);
    }
  }

  private static async _performIncrement(
    month: number,
    year: number,
    reportValue: number,
    organizationName: string
  ): Promise<number> {
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');
    const reportsBasePath = await getReportsBasePath();
    
    const counterFolderPath = path.join(reportsBasePath, 'global-counters', year.toString(), month.toString().padStart(2, '0'));
    await fs.mkdir(counterFolderPath, { recursive: true });

    const counterFilePath = path.join(counterFolderPath, 'counter.json');

    let counterData = {
      totalReports: 0,
      validReportsCount: 0,
      lastUpdated: new Date().toISOString(),
      month,
      year,
      processedOrganizations: [] as Array<{
        name: string;
        timestamp: string;
        value: number;
        counterAssigned: number;
      }>,
    };

    try {
      const data = await fs.readFile(counterFilePath, 'utf8');
      counterData = { ...counterData, ...JSON.parse(data) };
    } catch {
      // Fajl ne postoji → novi counter
    }

    counterData.totalReports += 1;
    counterData.validReportsCount += 1;
    const newCounterValue = counterData.validReportsCount;

    counterData.processedOrganizations.push({
      name: organizationName,
      timestamp: new Date().toISOString(),
      value: reportValue,
      counterAssigned: newCounterValue,
    });

    counterData.lastUpdated = new Date().toISOString();

    await fs.writeFile(counterFilePath, JSON.stringify(counterData, null, 2));

    console.log(`Counter ${newCounterValue} → ${organizationName} (iznos: ${reportValue})`);
    return newCounterValue;
  }
}

// ============================================
// Pomoćne funkcije
// ============================================

async function getMasterTemplatePath(templateType: TemplateType): Promise<string> {
  const path = await import('path');
  const templatesPath = await getTemplatesPath();
  return path.join(templatesPath, `humanitarian-template-${templateType}.xlsx`);
}

async function validateMasterTemplate(templateType: TemplateType) {
  try {
    const fs = await import('fs').then(m => m.promises);
    const templatePath = await getMasterTemplatePath(templateType);
    await fs.access(templatePath);
    
    // ✅ ISPRAVKA: dodaj fs.stat poziv
    const stats = await fs.stat(templatePath);
    if (stats.size === 0) throw new Error('Template je prazan');
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : 'Nepoznata greška' };
  }
}

// Bolji regex za datume u imenu fajla
function extractDatesFromFileName(fileName: string) {
  const match = fileName.match(/__(\d{8})_(\d{4})__(\d{8})_(\d{4})\./);
  if (!match) return { isValid: false };

  const [_, startDate, startTime, endDate, endTime] = match;
  const start = new Date(
    parseInt(startDate.substr(4, 4)),
    parseInt(startDate.substr(2, 2)) - 1,
    parseInt(startDate.substr(0, 2))
  );
  const month = start.getMonth() + 1;
  const year = start.getFullYear();

  return { isValid: true, month, year };
}

function isFileForPeriod(fileName: string, targetMonth: number, targetYear: number) {
  const result = extractDatesFromFileName(fileName);
  if (!result.isValid) return false;
  return result.month === targetMonth && result.year === targetYear;
}

// Čitanje originalnog izveštaja (D24 ili poslednja vrednost u C/N koloni)
async function getOriginalReportValue(
  org: OrganizationData,
  month: number,
  year: number,
  paymentType: PaymentType
): Promise<number> {
  try {
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');
    
    const orgFolder = generateOrganizationFolderName(org.shortNumber || 'unknown', org.name);
    
    // ✅ Runtime path construction - sakriveno od Turbopack
    const basePath = await getOriginalReportsPath();
    const dirPath = await buildReportPath(
      basePath,
      orgFolder, 
      year.toString(), 
      month.toString().padStart(2, '0'), 
      paymentType
    );
    
    let files: string[] = [];
    try {
      files = await fs.readdir(dirPath);
    } catch {
      console.log(`Folder ne postoji: ${dirPath}`);
      return 0;
    }

    const excelFiles = files.filter(f => /\.(xls|xlsx)$/i.test(f));
    if (excelFiles.length === 0) return 0;

    // Prvo tražimo fajl sa tačnim periodom
    let targetFile = excelFiles.find(f => isFileForPeriod(f, month, year));
    if (!targetFile) targetFile = excelFiles[0]; // fallback

    const filePath = await buildReportPath(dirPath, targetFile);

    if (targetFile.toLowerCase().endsWith('.xls')) {
      const XLSX = await import('xlsx');
      const buffer = await fs.readFile(filePath);
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[paymentType === 'prepaid' ? 0 : wb.SheetNames.length - 1]];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      const colIndex = paymentType === 'prepaid' ? 2 : 13; // C ili N
      for (let i = json.length - 1; i >= 0; i--) {
        const val = (json[i] as any[])[colIndex];
        if (val !== undefined && val !== null && val !== '') {
          return parseFloat(val.toString()) || 0;
        }
      }
    } else {
      const ExcelJS = await import('exceljs');
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(filePath);
      const ws = wb.worksheets[paymentType === 'prepaid' ? 0 : wb.worksheets.length - 1];
      if (!ws) return 0;

      const col = paymentType === 'prepaid' ? 'C' : 'N';
      let lastValue: any = null;
      ws.eachRow(row => {
        const cell = row.getCell(col);
        if (cell.value !== null && cell.value !== undefined) lastValue = cell.value;
      });
      return typeof lastValue === 'number' ? lastValue : parseFloat(lastValue || '0') || 0;
    }

    return 0;
  } catch (err) {
    console.error(`Greška pri čitanju originalnog izveštaja za ${org.name}:`, err);
    return 0;
  }
}

// ============================================
// GLAVNA FUNKCIJA
// ============================================

export async function generateHumanitarianTemplates(
  month: number,
  year: number,
  paymentType: PaymentType,
  templateType: TemplateType
): Promise<TemplateGenerationResult> {
  const generatedFiles: TemplateGenerationResult['generatedFiles'] = [];
  const errors: string[] = [];

  if (month < 1 || month > 12 || !year) {
    return { success: false, message: 'Nevalidan mesec ili godina', processed: 0 };
  }

  const templateCheck = await validateMasterTemplate(templateType);
  if (!templateCheck.isValid) {
    return {
      success: false,
      message: 'Master template nije dostupan ili je oštećen',
      processed: 0,
      errors: [templateCheck.error || 'Nepoznata greška']
    };
  }

  const organizations = await db.humanitarianOrg.findMany({
    where: {
      isActive: true,
      contracts: { some: { status: 'ACTIVE', startDate: { lte: new Date() }, endDate: { gte: new Date() } } }
    },
    select: {
      id: true,
      name: true,
      accountNumber: true,
      pib: true,
      registrationNumber: true,
      shortNumber: true,
      contracts: {
        where: { status: 'ACTIVE' },
        take: 1,
        select: { name: true, contractNumber: true, startDate: true, endDate: true }
      }
    }
  });

  if (organizations.length === 0) {
    return { success: false, message: 'Nema aktivnih humanitarnih organizacija', processed: 0 };
  }

  // Sortiranje po shortNumber (numerički) → konzistentan redosled → tačan counter
  organizations.sort((a, b) => {
    const aNum = a.shortNumber && /^\d+$/.test(a.shortNumber.trim()) 
      ? parseInt(a.shortNumber.trim(), 10) 
      : Infinity;

    const bNum = b.shortNumber && /^\d+$/.test(b.shortNumber.trim()) 
      ? parseInt(b.shortNumber.trim(), 10) 
      : Infinity;

    // Organizacije sa validnim brojem uvek idu pre onih bez broja
    if (aNum !== bNum) {
      return aNum - bNum; // manji broj → ranije
    }

    // Ako obe imaju isti broj (npr. obe Infinity), sortiraj po imenu
    return a.name.localeCompare(b.name);
  });
  
  console.log('\nREDOSLED OBRADE ORGANIZACIJA (po shortNumber):');
  organizations.forEach((org, idx) => {
    const sn = org.shortNumber?.trim() || '(nema)';
    console.log(`${String(idx + 1).padStart(2)}. ${sn.padEnd(8)} → ${org.name}`);
  });
  console.log('─────────────────────────────────────────────\n');

  // SEKVENCijALNO – ključno za tačnost countera
  for (const [index, org] of organizations.entries()) {
    console.log(`\n[${index + 1}/${organizations.length}] Obrađujem: ${org.shortNumber || 'N/A'} – ${org.name}`);

    try {
      const result = await generateTemplateForOrganization({
        id: org.id,
        name: org.name,
        accountNumber: org.accountNumber,
        pib: org.pib,
        registrationNumber: org.registrationNumber,
        shortNumber: org.shortNumber,
        activeContract: org.contracts[0] || null
      }, month, year, paymentType, templateType);

      generatedFiles.push(result);
    } catch (err: any) {
      const msg = `Greška za ${org.name}: ${err.message}`;
      console.error(msg);
      errors.push(msg);
      generatedFiles.push({
        organizationName: org.name,
        fileName: '',
        status: 'error',
        message: err.message
      });
    }
  }

  const successCount = generatedFiles.filter(f => f.status === 'success').length;

  return {
    success: successCount > 0,
    message: successCount === organizations.length
      ? `Uspešno generisano svih ${successCount} template-a`
      : `Generisano ${successCount} od ${organizations.length}`,
    processed: successCount,
    errors: errors.length > 0 ? errors : undefined,
    generatedFiles
  };
}

async function generateTemplateForOrganization(
  org: OrganizationData,
  month: number,
  year: number,
  paymentType: PaymentType,
  templateType: TemplateType
): Promise<{ organizationName: string; fileName: string; status: 'success' | 'error'; message?: string }> {
  const fs = await import('fs').then(m => m.promises);
  const path = await import('path');
  
  const reportsBasePath = await getReportsBasePath();
  const orgFolderPath = path.join(reportsBasePath, org.id, year.toString(), month.toString().padStart(2, '0'));
  await fs.mkdir(orgFolderPath, { recursive: true });

  const reportValue = await getOriginalReportValue(org, month, year, paymentType);
  const counterValue = await GlobalCounterManager.incrementIfValid(month, year, reportValue, org.name);

  const safeName = org.name.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `template_${safeName}_${paymentType}_${month.toString().padStart(2, '0')}_${year}.xlsx`;
  const filePath = path.join(orgFolderPath, fileName);

  const success = await generateWithExcelJS(org, month, year, paymentType, templateType, filePath, reportValue, counterValue);

  return success
    ? { organizationName: org.name, fileName, status: 'success' }
    : { organizationName: org.name, fileName, status: 'error', message: 'Neuspešno generisanje Excel fajla' };
}

async function generateWithExcelJS(
  org: OrganizationData,
  month: number,
  year: number,
  paymentType: PaymentType,
  templateType: TemplateType,
  filePath: string,
  reportValue: number,
  counterValue: number | null
): Promise<boolean> {
  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const templatePath = await getMasterTemplatePath(templateType);
    await workbook.xlsx.readFile(templatePath);

    const ws = workbook.getWorksheet(1);
    if (!ws) throw new Error('Nema worksheet-a u template-u');

    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    const period = `${format(monthStart, 'd.MM.yyyy')} do ${format(monthEnd, 'd.MM.yyyy')}`;

    const contractText = org.activeContract
      ? `Уговор ${org.activeContract.name}${org.activeContract.startDate ? ` од ${format(org.activeContract.startDate, 'dd.MM.yyyy')}` : ''}`
      : '';

    // Popunjavamo samo potrebne ćelije
    const updates: Array<{ cell: string; value: any }> = [
      ...(counterValue !== null ? [{ cell: 'D18', value: counterValue }] : []),
      { cell: 'E18', value: `/${month.toString().padStart(2, '0')}` },
      { cell: 'A19', value: contractText },
      { cell: 'D21', value: org.name },
      { cell: 'D24', value: reportValue },
      { cell: 'E39', value: period },
      { cell: 'D29', value: `ПИБ ${org.pib || ''}` },
      { cell: 'F29', value: `матични број ${org.registrationNumber || ''}` },
      { cell: 'G40', value: org.shortNumber || '' },
      { cell: 'D38', value: `Наплаћен износ у ${paymentType} саобраћају у периоду` },
    ];

    updates.forEach(({ cell, value }) => {
      try {
        ws.getCell(cell).value = value;
      } catch (e) {
        console.warn(`Neuspešno upisivanje u ćeliju ${cell}:`, e);
      }
    });

    // Očistimo nepotrebne ćelije
    if (counterValue === null) ws.getCell('D18').value = null;
    ['F24', 'G24', 'H24'].forEach(c => ws.getCell(c).value = null);

    await workbook.xlsx.writeFile(filePath);
    console.log(`Generisano: ${filePath} (counter: ${counterValue ?? '—'})`);
    return true;
  } catch (err) {
    console.error(`ExcelJS greška za ${org.name}:`, err);
    return false;
  }
}