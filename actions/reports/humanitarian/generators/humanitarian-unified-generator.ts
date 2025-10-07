// /actions/reports/humanitarian/generators/humanitarian-unified-generator.ts
import { promises as fs } from 'fs';
import path from 'path';
import { getMonthName, getPreviousMonthName } from '../utils/date-utils';
import { getOrganizationsWithReportData, getPrepaidLastRowValuesForOrg } from '../data/fetch-organizations';

export class HumanitarianUnifiedGenerator {
  static async generate(month: number, year: number) {
    const templatesDir = path.resolve('templates');
    const reportsDir = path.resolve('public', 'reports', 'prepaid'); // ✅ Promenjena putanja
    const prevMonthName = getPreviousMonthName(month, year);
    const currentMonthName = getMonthName(month);
    const templateName = `Humanitarni_SMS_i_VOICE_brojevi_2021-2025-${prevMonthName}_${year}.xlsx`;
    const templateFile = path.join(templatesDir, templateName);

    console.log(`📄 Loading unified humanitarian template: ${templateFile}`);

    // ✅ Provera da li fajl postoji
    try {
      await fs.access(templateFile);
    } catch {
      throw new Error(`❌ Template not found: ${templateFile}`);
    }

    // ✅ Kreiraj direktorijum ako ne postoji
    try {
      await fs.mkdir(reportsDir, { recursive: true });
    } catch (error) {
      console.log(`⚠️ Could not create directory ${reportsDir}:`, error);
    }

    // ✅ Import ExcelJS
    let ExcelJS;
    try {
      ExcelJS = await import('exceljs');
    } catch (importError) {
      throw new Error('ExcelJS not available');
    }

    // ✅ Učitavanje Excel template-a preko ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templateFile);

    // Prethodni sheet (za kopiranje)
    const prevSheetName = workbook.worksheets.find(
      (ws) => ws.name.toLowerCase() === `${prevMonthName.toLowerCase()}_${year}`.toLowerCase()
    )?.name;

    if (!prevSheetName) {
      throw new Error(`❌ Sheet "${prevMonthName}_${year}" nije pronađen u template-u. Prekidam generisanje.`);
    }

    const prevSheet = workbook.getWorksheet(prevSheetName);
    if (!prevSheet) {
      throw new Error(`❌ Cannot access sheet "${prevSheetName}"`);
    }

    // 📋 Novi sheet za aktuelni mesec (kopija prethodnog)
    const newSheetName = `${currentMonthName}_${year}`;
    
    // Kopiraj sheet sa svim formatiranjima
    const newSheet = workbook.addWorksheet(newSheetName);
    
    // Sačuvaj merge info pre kopiranja
    const mergedCells: string[] = [];
    
    // Kopiraj strukturu i formatiranje
    prevSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      const newRow = newSheet.getRow(rowNumber);
      newRow.height = row.height;
      
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const newCell = newRow.getCell(colNumber);
        
        // Kopiraj vrednost i stil
        newCell.value = cell.value;
        newCell.style = { ...cell.style };
        
        // Sačuvaj merge info
        if (cell.isMerged && cell.master === cell) {
          const master = prevSheet._merges[cell.address];
          if (master) {
            mergedCells.push(master);
          }
        }
      });
      
      newRow.commit();
    });

    // Kopiraj širine kolona
    prevSheet.columns.forEach((col, idx) => {
      if (newSheet.columns[idx]) {
        newSheet.columns[idx].width = col.width;
      }
    });

    // Primeni sve merge cells
    mergedCells.forEach(range => {
      try {
        newSheet.mergeCells(range);
      } catch (e) {
        // Ignoriši duplikate
      }
    });

    console.log(`📊 Created new sheet: ${newSheetName}`);

    // 🧹 Očisti B7:I37 pre unosa novih podataka
    for (let row = 7; row <= 37; row++) {
      ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(col => {
        const cell = newSheet.getCell(`${col}${row}`);
        cell.value = null;
      });
    }

    console.log(`🧹 Cleared B7:I37 in ${newSheetName}`);

    // 🔗 Re-merge kolonu K (K7:K37)
    try {
      newSheet.mergeCells('K7:K37');
      console.log(`🔗 Re-merged K7:K37`);
    } catch (e) {
      console.log(`⚠️ Could not merge K7:K37:`, e);
    }

    // 🧮 Uzimamo sve organizacije (prepaid)
    const organizations = await getOrganizationsWithReportData(month, year, 'prepaid');
    organizations.sort((a, b) => a.name.localeCompare(b.name));

    let rowIndex = 7; // Početni red je 7 (B7, C7, ...)

    for (const org of organizations) {
      let values = await getPrepaidLastRowValuesForOrg(org, month, year);
      
      // ✅ Fallback: Ako nema vrednosti ili nisu brojevi, postavi [0, 0, 0, 0]
      const hasValidData = values && 
        values.length === 4 && 
        values.some(v => v !== null && v !== '' && !isNaN(Number(v)));

      if (!hasValidData) {
        console.log(`⚠️ No valid numeric data for ${org.name}, using fallback [0, 0, 0, 0]`);
        values = [0, 0, 0, 0];
      } else {
        // Normalizuj vrednosti: ako nije broj, stavi 0
        values = values.map(v => {
          const num = Number(v);
          return (v === null || v === '' || isNaN(num)) ? 0 : num;
        });
      }

      console.log(`📝 Writing data for ${org.name} at row ${rowIndex}`, values);

      // B kolona = ime organizacije
      newSheet.getCell(`B${rowIndex}`).value = org.name;

      // C kolona = samo broj ugovora (contracts.name)
      const contractNumber = org.contracts && org.contracts.length > 0 
        ? org.contracts[0].name 
        : '';
      newSheet.getCell(`C${rowIndex}`).value = contractNumber;

      // D kolona = kratki broj
      newSheet.getCell(`D${rowIndex}`).value = org.shortNumber ?? '';

      // E kolona = null (za sada)
      newSheet.getCell(`E${rowIndex}`).value = null;

      // F–I kolone = poslednji redovi iz prepaid fajla (B → F, C → G, D → H, E → I)
      // Ako vrednost nije broj, upisi 0
      ['F', 'G', 'H', 'I'].forEach((col, idx) => {
        newSheet.getCell(`${col}${rowIndex}`).value = values[idx];
      });

      rowIndex++;
    }

    console.log(`✅ Populated ${rowIndex - 7} organizations in unified sheet`);

    // 💾 Upis novog fajla
    const outputName = `Humanitarni_SMS_i_VOICE_brojevi_2021-2025-${currentMonthName}_${year}.xlsx`;
    const outputPath = path.join(reportsDir, outputName);

    // ✅ Pisanje preko ExcelJS
    await workbook.xlsx.writeFile(outputPath);

    console.log(`✅ Unified humanitarian report generated: ${outputPath}`);

    return {
      success: true,
      totalOrganizations: organizations.length,
      path: outputPath
    };
  }
}