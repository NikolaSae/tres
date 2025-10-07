// actions/reports/generate-all-humanitarian-reports.ts - IMPROVED VERSION
// /actions/reports/generate-all-humanitarian-reports.ts
'use server';

import { generateAllHumanitarianReports as innerGenerate } from './humanitarian/index';

export async function generateAllHumanitarianReports(
  month: number,
  year: number,
  paymentType: 'prepaid' | 'postpaid',
  templateType: 'telekom' | 'mts' = 'telekom'
) {
  return innerGenerate(month, year, paymentType, templateType);
  
}
