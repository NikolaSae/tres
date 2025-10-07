// actions/reports/humanitarian/generators/template-generator.ts
import path from 'path';
import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';
import { MONTHS_SR, TEMPLATES_PATH } from '../constants';
import { getMasterTemplatePath, ensureDirectoryExists, sanitizeFileName } from '../utils/file-utils';
import { getOrganizationsWithReportData, getPrepaidLastRowValuesForOrg } from '../data/fetch-organizations';
import { formatContractInfo } from '../utils/contract-formatter';
import { OrganizationReportData, TemplateType, PaymentType } from '../types';
import { REPORTS_BASE_PATH } from '../constants';

export class TemplatePopulator {
  /**
   * Generates a single populated template file for all humanitarian organizations.
   * - month/year: target month that we are generating for (e.g. 9 / 2025 for September 2025)
   * - templateType: 'telekom' | 'globaltel'
   * returns path to generated file
   */
  static async generatePopulatedTemplate(
    month: number,
    year: number,
    templateType: TemplateType = 'telekom'
  ): Promise<string> {
    // compute previous month
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }

    const masterPath = getMasterTemplatePath(templateType);
    await fs.access(masterPath); // will throw if not found

    const buffer = await fs.readFile(masterPath);
    const workbook = XLSX.read(buffer, { type: 'buffer', raw: true });

    const prevMonthName = MONTHS_SR[prevMonth - 1]; // e.g. 'Avgust'
    const targetMonthName = MONTHS_SR[month - 1]; // e.g. 'Septembar'
    const targetSheetName = `${targetMonthName} ${year}`;
    const prevSheetCandidates = workbook.SheetNames.filter(sn =>
      sn.toLowerCase().includes(prevMonthName.toLowerCase()) && sn.includes(prevYear.toString())
    );

    let prevSheetName = prevSheetCandidates.length ? prevSheetCandidates[0] : null;
    if (!prevSheetName) {
      // try looser match (by month only)
      prevSheetName = workbook.SheetNames.find(sn => sn.toLowerCase().includes(prevMonthName.toLowerCase())) || null;
    }

    if (!prevSheetName) {
      throw new Error(`Could not find template sheet for previous month ${prevMonthName} ${prevYear} in master template`);
    }

    // copy prev sheet into new target sheet name
    const srcSheet = workbook.Sheets[prevSheetName];
    // deep clone sheet object
    const cloned = JSON.parse(JSON.stringify(srcSheet));
    workbook.SheetNames.push(targetSheetName);
    workbook.Sheets[targetSheetName] = cloned;

    // clear B7:I37 on target sheet
    const ws = workbook.Sheets[targetSheetName]!;
    for (let r = 7; r <= 37; r++) {
      for (let c = 'B'.charCodeAt(0); c <= 'I'.charCodeAt(0); c++) {
        const coord = `${String.fromCharCode(c)}${r}`;
        // assign empty string cell
        ws[coord] = { t: 's', v: '' };
      }
    }

    // fetch organizations (prepaid data required)
    const organizations = await getOrganizationsWithReportData(month, year, 'prepaid');

    // fill rows starting at row 7
    const maxRows = 37 - 7 + 1; // 31 rows
    const toProcess = organizations.slice(0, maxRows);

    for (let i = 0; i < toProcess.length; i++) {
      const org = toProcess[i];
      const row = 7 + i;
      const contractInfo = formatContractInfo(org.contracts);

      // set B (name)
      ws[`B${row}`] = { t: 's', v: org.name || '' };
      // set C (contractInfo)
      ws[`C${row}`] = { t: 's', v: contractInfo || '' };
      // set D (short number)
      ws[`D${row}`] = { t: 's', v: org.shortNumber || '' };
      // set E null (leave blank)
      ws[`E${row}`] = { t: 's', v: '' };

      // get prepaid last row values for this org (columns B,C,D,E in original report)
      const values = await getPrepaidLastRowValuesForOrg(org as any, month, year); // returns array of 4 values
      // map to F..I
      const targetCols = ['F', 'G', 'H', 'I'];
      for (let k = 0; k < targetCols.length; k++) {
        const v = values[k];
        if (v === null || v === undefined) {
          ws[`${targetCols[k]}${row}`] = { t: 's', v: '' };
        } else if (typeof v === 'number') {
          ws[`${targetCols[k]}${row}`] = { t: 'n', v };
        } else {
          ws[`${targetCols[k]}${row}`] = { t: 's', v: String(v) };
        }
      }
    }

    // update sheet range if necessary (optional; keep existing !ref)
    if (!ws['!ref']) {
      ws['!ref'] = `A1:Z100`;
    }

    // write output file
    const outDir = path.join(process.cwd(), 'public', 'reports', 'templates');
    await ensureDirectoryExists(outDir);

    const outName = sanitizeFileName(`humanitarian_template_populated_${month.toString().padStart(2, '0')}_${year}.xlsx`);
    const outPath = path.join(outDir, outName);

    // if exists, remove
    try { await fs.unlink(outPath); } catch (e) { /* ignore */ }

    XLSX.writeFile(workbook, outPath);

    return outPath;
  }
}
