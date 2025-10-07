//  /actions/reports/humanitarian/core/excel-writer.ts

import { promises as fs } from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { OrganizationReportData, PaymentType, TemplateType, CellUpdate } from '../types';
import { getMasterTemplatePath, ensureDirectoryExists, safeFileDelete, sanitizeFileName } from '../utils/file-utils';
import { formatContractInfo } from '../utils/contract-formatter';
import { GlobalCounterManager } from './counter-manager';
import { readExcelValue } from './excel-reader';
import { getOriginalReportValue } from '../data/fetch-organizations';

export async function generateCompleteReportWithExcelJS(
  org: OrganizationReportData,
  month: number,
  year: number,
  paymentType: PaymentType,
  templateType: TemplateType,
  filePath: string
): Promise<boolean> {
  try {
    let ExcelJS;
    try {
      ExcelJS = await import('exceljs');
    } catch (importError) {
      console.log('ExcelJS not available:', importError);
      return false;
    }

    const masterTemplatePath = getMasterTemplatePath(templateType);
    try {
      await fs.access(masterTemplatePath, fs.constants.R_OK);
    } catch (accessError) {
      console.log('Master template not accessible:', accessError);
      return false;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(masterTemplatePath);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('Worksheet not found');
    }

    const reportValue = await getOriginalReportValue(org, month, year, paymentType);
    console.log(`>>> ${org.name}: reportValue = ${reportValue} (${paymentType})`);

    const counterValue = await GlobalCounterManager.incrementIfValid(
      month, 
      year, 
      reportValue, 
      org.name,
      'complete-reports'
    );
    
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    const dateRange = `${format(monthStart, 'd.MM.yyyy')} do ${format(monthEnd, 'd.MM.yyyy')}`;
    
    const contractInfo = formatContractInfo(org.contracts);

    const updates: CellUpdate[] = [
      ...(counterValue !== null ? [{ cell: 'D18', value: counterValue }] : []),
      { cell: 'E18', value: `/${month.toString().padStart(2, '0')}` },
      { cell: 'A19', value: contractInfo },
      { cell: 'D21', value: org.name },
      { cell: 'D24', value: reportValue },
      { cell: 'E39', value: dateRange },
      { cell: 'D29', value: `ПИБ ${org.pib || ''}` },
      { cell: 'F29', value: `матични број ${org.registrationNumber || ''}` },
      { cell: 'G40', value: org.shortNumber || '' },
      { cell: 'D38', value: `Наплаћен износ у ${paymentType} саобраћају у периоду` },
      { cell: 'D33', value: org.mission },
      { cell: 'D27', value: `Банка: ${org.bank}  Рачун: ${org.accountNumber}`},
    ];

    updates.forEach(({ cell, value }) => {
      try {
        const cellObj = worksheet.getCell(cell);
        cellObj.value = value;
      } catch (error) {
        console.log(`Could not update cell ${cell}:`, error);
      }
    });

    if (counterValue === null) {
      worksheet.getCell('D18').value = null;
    }

    worksheet.getCell('D24').value = reportValue;

    await workbook.xlsx.writeFile(filePath);
    console.log(`✅ Complete report generated for ${org.name}`);
    
    return true;
  } catch (error) {
    console.error(`Error in generateCompleteReportWithExcelJS for ${org.name}:`, error);
    return false;
  }
}

export async function generateReportWithFallback(
  org: OrganizationReportData,
  month: number,
  year: number,
  paymentType: PaymentType,
  templateType: TemplateType,
  filePath: string
): Promise<void> {
  try {
    const masterTemplatePath = getMasterTemplatePath(templateType);
    const templateBuffer = await fs.readFile(masterTemplatePath);
    
    const workbook = XLSX.read(templateBuffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const reportValue = await getOriginalReportValue(org, month, year, paymentType);

    const counterValue = await GlobalCounterManager.incrementIfValid(
      month,
      year,
      reportValue,
      org.name,
      'complete-reports'
    );

    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    const dateRange = `${format(monthStart, 'd.MM.yyyy')} do ${format(monthEnd, 'd.MM.yyyy')}`;
    
    const contractInfo = formatContractInfo(org.contracts);

    const updates: CellUpdate[] = [
      ...(counterValue !== null ? [{ cell: 'D18', value: counterValue }] : []),
      { cell: 'E18', value: `/${month.toString().padStart(2, '0')}` },
      { cell: 'A19', value: contractInfo },
      { cell: 'D21', value: org.name },
      { cell: 'D24', value: reportValue },
      { cell: 'E39', value: dateRange },
      { cell: 'D29', value: `ПИБ ${org.pib || ''}` },
      { cell: 'F29', value: `матични број ${org.registrationNumber || ''}` },
      { cell: 'G40', value: org.shortNumber || '' },
      { cell: 'D38', value: `Наплаћен износ у ${paymentType} саобраћају у периоду` },
      { cell: 'D33', value: org.mission },
      { cell: 'D27', value: `Банка: ${org.bank}  Рачун: ${org.accountNumber}`},
    ];

    updates.forEach(({ cell, value }) => {
      try {
        if (typeof value === 'number') {
          worksheet[cell] = { t: 'n', v: value };
        } else {
          worksheet[cell] = { t: 's', v: value?.toString() || '' };
        }
      } catch (error) {
        console.log(`Could not update cell ${cell}:`, error);
      }
    });

    const sanitizedFilePath = path.join(
      path.dirname(filePath),
      sanitizeFileName(path.basename(filePath))
    );

    const dir = path.dirname(sanitizedFilePath);
    await ensureDirectoryExists(dir);
    await safeFileDelete(sanitizedFilePath);

    XLSX.writeFile(workbook, sanitizedFilePath);
    console.log(`✅ Fallback report generated for ${org.name}`);

  } catch (error) {
    console.error(`❌ Error generating fallback report for ${org.name}:`, error);
    throw error;
  }
}