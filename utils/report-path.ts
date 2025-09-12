async function getOriginalReportValue(
  org: OrganizationReportData,
  month: number,
  year: number,
  paymentType: PaymentType
): Promise<number> {
  try {
    // Use the organization's shortNumber instead of ID
    // If shortNumber is not available, use a fallback
    const shortNumber = org.shortNumber || 'unknown';
    
    const orgFolderName = generateOrganizationFolderName(shortNumber, org.name);
    const originalReportPath = path.join(
      ORIGINAL_REPORTS_PATH,
      orgFolderName,
      year.toString(),
      month.toString().padStart(2, '0'),
      paymentType
    );

    console.log(`Looking for original reports in: ${originalReportPath}`);

    let files: string[] = [];
    try {
      files = await fs.readdir(originalReportPath);
    } catch (error) {
      console.log(`Original reports directory not found: ${originalReportPath}`);
      return 0;
    }

    const xlsFile = files.find(f => f.toLowerCase().endsWith('.xls'));
    if (!xlsFile) {
      console.log(`No .xls file found in ${originalReportPath}`);
      return 0;
    }

    const filePath = path.join(originalReportPath, xlsFile);
    console.log(`Found original report: ${filePath}`);

    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();

      await workbook.xlsx.readFile(filePath);

      let value = 0;

      if (paymentType === 'prepaid') {
        const worksheet = workbook.getWorksheet(1);
        if (worksheet) {
          let lastRow = 1;
          worksheet.eachRow((row, rowNumber) => {
            const cellValue = row.getCell('C').value;
            if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
              lastRow = rowNumber;
            }
          });

          const lastCell = worksheet.getCell(`C${lastRow}`);
          if (lastCell.value) {
            value = typeof lastCell.value === 'number' ? lastCell.value : parseFloat(lastCell.value as string) || 0;
          }
        }
      } else {
        const lastWorksheetIndex = workbook.worksheets.length;
        const worksheet = workbook.getWorksheet(lastWorksheetIndex);
        if (worksheet) {
          let lastRow = 1;
          worksheet.eachRow((row, rowNumber) => {
            const cellValue = row.getCell('N').value;
            if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
              lastRow = rowNumber;
            }
          });

          const lastCell = worksheet.getCell(`N${lastRow}`);
          if (lastCell.value) {
            value = typeof lastCell.value === 'number' ? lastCell.value : parseFloat(lastCell.value as string) || 0;
          }
        }
      }

      console.log(`Extracted value from original report: ${value}`);
      return value;
    } catch (excelError) {
      console.log('ExcelJS failed to read .xls file, returning 0:', excelError);
      return 0;
    }
  } catch (error) {
    console.error(`Error reading original report for ${org.name}:`, error);
    return 0;
  }
}