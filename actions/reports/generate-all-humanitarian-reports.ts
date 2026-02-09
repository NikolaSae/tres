// /actions/reports/generate-all-humanitarian-reports.ts
'use server';

import { generateAllHumanitarianReports as innerGenerate } from './humanitarian/index';
import { TemplateType, PaymentType } from './humanitarian/types';

export async function generateAllHumanitarianReports(
  month: number,
  year: number,
  paymentType: PaymentType,
  templateType: TemplateType = 'telekom'
) {
  return innerGenerate(month, year, paymentType, templateType);
}