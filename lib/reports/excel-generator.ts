//lib/reports/excel-generator.ts
import ExcelJS from "exceljs";

export async function generateExcelReport(data: any[], options?: {
  title?: string;
  headers?: string[];
  filename?: string;
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(options?.title || "Report");

  // Add headers
  if (options?.headers && options.headers.length > 0) {
    worksheet.addRow(options.headers);
  }

  // Add data rows
  data.forEach(row => {
    if (Array.isArray(row)) {
      worksheet.addRow(row);
    } else if (typeof row === 'object') {
      worksheet.addRow(Object.values(row));
    }
  });

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(maxLength + 2, 50);
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function generateCSVReport(data: any[]): Promise<string> {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",")
    )
  ].join("\n");

  return csv;
}