// /actions/reports/humanitarian/index.ts
import 'server-only';
import { promises as fs } from 'fs';
import { PaymentType, TemplateType, ReportGenerationResult, UnifiedHumanitarianReport } from './types';
import { GlobalCounterManager } from './core/counter-manager';
import { getOrganizationsWithReportData } from './data/fetch-organizations';
import { PrepaidReportGenerator } from './generators/prepaid-generator';
import { PostpaidReportGenerator } from './generators/postpaid-generator';
import { HumanitarianUnifiedGenerator } from './generators/humanitarian-unified-generator';
import { getMasterTemplatePath } from './utils/file-utils';

export async function generateAllHumanitarianReports(
  month: number,
  year: number,
  paymentType: PaymentType,
  templateType: TemplateType = 'telekom'
): Promise<ReportGenerationResult> {
  const generatedFiles: ReportGenerationResult['generatedFiles'] = [];
  const errors: string[] = [];

  try {
    GlobalCounterManager.startNewGeneration();
    console.log(`🔄 Started NEW generation for ${month}/${year} ${paymentType}`);

    if (!month || !year || month < 1 || month > 12) {
      return {
        success: false,
        message: '❌ Nevalidni parametri: mesec mora biti između 1 i 12',
        processed: 0,
        errors: ['Nevalidni parametri za mesec ili godinu']
      };
    }

    // 🔹 Provera master template (samo za prepaid/postpaid generator)
    try {
      await fs.access(getMasterTemplatePath(templateType));
    } catch {
      return {
        success: false,
        message: '❌ Master template fajl nije pronađen',
        processed: 0,
        errors: ['Master template fajl nije dostupan']
      };
    }

    // 🔹 Učitavanje organizacija
    const organizations = await getOrganizationsWithReportData(month, year, paymentType);

    if (organizations.length === 0) {
      return {
        success: false,
        message: '⚠️ Nije pronađena nijedna aktivna humanitarna organizacija',
        processed: 0
      };
    }

    // 🔹 ISPRAVNO SORTIRANJE PO shortNumber (ascending)
    organizations.sort((a, b) => {
      const getNum = (short: string | null | undefined): number => {
        if (!short) return Infinity;
        const trimmed = short.trim();
        if (!trimmed) return Infinity;
        const num = parseInt(trimmed, 10);
        return isNaN(num) ? Infinity : num;
      };

      const numA = getNum(a.shortNumber);
      const numB = getNum(b.shortNumber);

      if (numA !== numB) {
        return numA - numB;
      }

      return a.name.localeCompare(b.name);
    });

    console.log(`Obrada ${organizations.length} organizacija – redosled po shortNumber:`);
    organizations.forEach((org, i) => {
      console.log(
        `${String(i + 1).padStart(2)}. ${String(org.shortNumber || 'NULL').padEnd(6)} → ${org.name}`
      );
    });

    // 🔹 Izbor generatora
    const generator =
      paymentType === 'prepaid'
        ? new PrepaidReportGenerator()
        : new PostpaidReportGenerator();

    for (const org of organizations) {
      try {
        const result = await generator.generateReportForOrganization(
          org,
          month,
          year,
          templateType
        );
        generatedFiles.push(result);
      } catch (error) {
        const errorMsg = `❌ Greška za ${org.name}: ${
          error instanceof Error ? error.message : 'Nepoznata greška'
        }`;
        errors.push(errorMsg);
        generatedFiles.push({
          organizationName: org.name,
          fileName: '',
          status: 'error',
          message: errorMsg
        });
      }
    }

    // 🔹 Unified humanitarian generator
    let unifiedReport: UnifiedHumanitarianReport | undefined;

    try {
      console.log('📦 Generating unified humanitarian Excel report...');
      unifiedReport = await HumanitarianUnifiedGenerator.generate(month, year);
      console.log(`✅ Unified humanitarian report done: ${unifiedReport.path}`);
    } catch (error) {
      console.error('❌ Unified generator failed:', error);
      errors.push(
        error instanceof Error
          ? error.message
          : 'Nepoznata greška u unified generatoru'
      );
    }

    const successCount = generatedFiles.filter(f => f.status === 'success').length;

    GlobalCounterManager.finishGeneration();

    return {
      success: successCount > 0,
      message:
        successCount === organizations.length
          ? `✅ Uspešno generisano ${successCount} kompletnih ${paymentType} izveštaja + unified report`
          : `⚠️ Uspešno generisano ${successCount} od ${organizations.length} ${paymentType} izveštaja (unified report: ${
              unifiedReport ? 'urađen' : 'nije urađen'
            })`,
      processed: successCount,
      errors: errors.length > 0 ? errors : undefined,
      generatedFiles,
      unifiedReport
    };
  } catch (error) {
    GlobalCounterManager.finishGeneration();
    console.error('❌ Error in generateAllHumanitarianReports:', error);

    return {
      success: false,
      message: `Greška pri generisanju kompletnih ${paymentType} izveštaja`,
      processed: 0,
      errors: [error instanceof Error ? error.message : 'Nepoznata greška']
    };
  }
}
