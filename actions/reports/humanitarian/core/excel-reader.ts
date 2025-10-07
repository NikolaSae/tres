//  /actions/reports/humanitarian/core/excel-reader.ts


import { promises as fs } from 'fs';
import { PaymentType } from '../types';

export async function readExcelValue(filePath: string, paymentType: PaymentType): Promise<number> {
  try {
    let value = 0;

    if (filePath.toLowerCase().endsWith('.xls')) {
      value = await readXlsFile(filePath, paymentType);
    } else {
      value = await readXlsxFile(filePath, paymentType);
    }

    console.log(`Final extracted value: ${value}`);
    return value;
  } catch (readError) {
    console.log('❌ Failed to read Excel file:', readError);
    return 0;
  }
}

async function readXlsFile(filePath: string, paymentType: PaymentType): Promise<number> {
  const XLSX = await import('xlsx');
  const fileBuffer = await fs.readFile(filePath);
  const workbook = XLSX.read(fileBuffer, { 
    type: 'buffer',
    cellText: false,
    cellNF: false,
    cellHTML: false,
    raw: true
  });
  
  console.log('✓ Successfully read .xls file');

  let sheetIndex: number;
  let targetColumn: string;

  if (paymentType === 'prepaid') {
    sheetIndex = 0;
    targetColumn = 'C';
  } else {
    sheetIndex = workbook.SheetNames.length - 1;
    targetColumn = 'N';
  }

  const sheetName = workbook.SheetNames[sheetIndex];
  console.log(`Using sheet: ${sheetName}`);
  
  return extractValueFromSheet(workbook, sheetIndex, targetColumn);
}

async function readXlsxFile(filePath: string, paymentType: PaymentType): Promise<number> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  console.log('✓ Successfully read .xlsx file');

  if (paymentType === 'prepaid') {
    return extractValueFromExcelJSWorksheet(workbook.getWorksheet(1), 'C');
  } else {
    const lastWorksheetIndex = workbook.worksheets.length;
    return extractValueFromExcelJSWorksheet(workbook.getWorksheet(lastWorksheetIndex), 'N');
  }
}

function extractValueFromSheet(workbook: any, sheetIndex: number, column: string): number {
  const sheetName = workbook.SheetNames[sheetIndex];
  const worksheet = workbook.Sheets[sheetName];
  
  if (!worksheet) {
    return 0;
  }

  const columnIndex = column.charCodeAt(0) - 65;
  let lastValue = 0;
  let lastRowFound = 0;
  
  for (const cellAddress in worksheet) {
    if (cellAddress.startsWith('!')) continue;
    
    const cellColumn = cellAddress.match(/^([A-Z]+)/)?.[1];
    if (cellColumn === column) {
      const cellValue = worksheet[cellAddress];
      if (cellValue && cellValue.v !== undefined && cellValue.v !== null && cellValue.v !== '') {
        const rowNumber = parseInt(cellAddress.replace(/[A-Z]/g, ''));
        if (rowNumber > lastRowFound) {
          lastRowFound = rowNumber;
          lastValue = typeof cellValue.v === 'number' ? cellValue.v : parseFloat(cellValue.v) || 0;
        }
      }
    }
  }
  
  if (lastRowFound > 0) {
    return lastValue;
  }
  
  try {
    const XLSX = require('xlsx') || (global as any).XLSX;
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '', 
      raw: true
    }) as any[][];
    
    if (!jsonData || jsonData.length === 0) {
      return 0;
    }
    
    for (let i = jsonData.length - 1; i >= 0; i--) {
      const row = jsonData[i];
      if (row && row[columnIndex] !== undefined && row[columnIndex] !== null && row[columnIndex] !== '') {
        const cellValue = row[columnIndex];
        return typeof cellValue === 'number' ? cellValue : parseFloat(cellValue) || 0;
      }
    }
  } catch (jsonError) {
    console.error('JSON extraction failed:', jsonError);
  }
  
  return 0;
}

function extractValueFromExcelJSWorksheet(worksheet: any, column: string): number {
  if (!worksheet) return 0;

  let lastRow = 1;
  worksheet.eachRow((row: any, rowNumber: number) => {
    const cellValue = row.getCell(column).value;
    if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
      lastRow = rowNumber;
    }
  });

  const lastCell = worksheet.getCell(`${column}${lastRow}`);
  if (lastCell.value) {
    return typeof lastCell.value === 'number' ? lastCell.value : parseFloat(lastCell.value as string) || 0;
  }
  
  return 0;
}
export async function extractLastRowValues(
  filePath: string,
  columns: string[] = ['B', 'C', 'D', 'E']
): Promise<Array<string | number | null>> {
  try {
    const lower = filePath.toLowerCase();
    if (lower.endsWith('.xls')) {
      const XLSX = await import('xlsx');
      const fs = await import('fs/promises');
      const buf = await fs.readFile(filePath);
      const workbook = XLSX.read(buf, { type: 'buffer', raw: true });
      const sheetName = workbook.SheetNames[0];
      const ws = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true }) as any[][];
      if (!json || json.length === 0) return columns.map(() => null);

      // scan from bottom up for the first row that has any non-empty value in any of the target columns
      for (let r = json.length - 1; r >= 0; r--) {
        const row = json[r] || [];
        const hasAny = columns.some(col => {
          const idx = col.charCodeAt(0) - 65;
          const cell = row[idx];
          return cell !== undefined && cell !== null && cell !== '';
        });
        if (hasAny) {
          return columns.map(col => {
            const idx = col.charCodeAt(0) - 65;
            const val = row[idx];
            return val === undefined ? null : val;
          });
        }
      }
      return columns.map(() => null);
    } else {
      // .xlsx path via exceljs
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) return columns.map(() => null);

      // scan from bottom up, use worksheet.rowCount as starting point
      for (let r = worksheet.rowCount; r >= 1; r--) {
        const row = worksheet.getRow(r);
        const hasAny = columns.some(col => {
          const cell = row.getCell(col).value;
          return cell !== null && cell !== undefined && cell !== '';
        });
        if (hasAny) {
          return columns.map(col => {
            const cell = row.getCell(col).value;
            // normalize ExcelJS types to primitive
            if (cell === null || cell === undefined) return null;
            if (typeof cell === 'object' && 'richText' in cell) {
              return (cell as any).richText.map((p: any) => p.text).join('');
            }
            if (typeof cell === 'object' && 'text' in cell) return (cell as any).text;
            if (typeof cell === 'object' && 'result' in cell) return (cell as any).result;
            return cell;
          });
        }
      }
      return columns.map(() => null);
    }
  } catch (err) {
    console.error('extractLastRowValues error for', filePath, err);
    return columns.map(() => null);
  }
}