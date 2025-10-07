//  /actions/reports/humanitarian/generators/base-generator.ts

import path from 'path';
import { OrganizationReportData, PaymentType, TemplateType, GeneratedFile } from '../types';
import { generateOrganizationFolderName } from '@/utils/report-path';
import { ensureDirectoryExists, sanitizeFileName } from '../utils/file-utils';
import { generateCompleteReportWithExcelJS, generateReportWithFallback } from '../core/excel-writer';

export abstract class BaseReportGenerator {
  abstract getPaymentType(): PaymentType;

  async generateReportForOrganization(
    org: OrganizationReportData,
    month: number,
    year: number,
    templateType: TemplateType
  ): Promise<GeneratedFile> {
    try {
      const paymentType = this.getPaymentType();
      const orgFolderName = generateOrganizationFolderName(org.shortNumber, org.name);
      
      const orgFolderPath = path.join(
        process.cwd(), 
        'public',
        'reports',
        orgFolderName,
        year.toString(),
        month.toString().padStart(2, '0'),
        paymentType
      );
      
      await ensureDirectoryExists(orgFolderPath);

      const fileName = `complete_report_${sanitizeFileName(org.name)}_${paymentType}_${month.toString().padStart(2, '0')}_${year}.xlsx`;
      const filePath = path.join(orgFolderPath, fileName);

      try {
        const result = await generateCompleteReportWithExcelJS(
          org, 
          month, 
          year, 
          paymentType, 
          templateType, 
          filePath
        );
        
        if (result) {
          return {
            organizationName: org.name,
            fileName,
            status: 'success'
          };
        }
      } catch (error) {
        console.log('ExcelJS failed, trying fallback:', error);
      }

      await generateReportWithFallback(org, month, year, paymentType, templateType, filePath);

      return {
        organizationName: org.name,
        fileName,
        status: 'success'
      };
    } catch (error) {
      throw new Error(`Greška za organizaciju ${org.name}: ${error instanceof Error ? error.message : 'Nepoznata greška'}`);
    }
  }
}