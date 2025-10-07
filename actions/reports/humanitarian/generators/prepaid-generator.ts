//  /actions/reports/humanitarian/generators/prepaid-generator.ts

import { PaymentType } from '../types';
import { BaseReportGenerator } from './base-generator';

export class PrepaidReportGenerator extends BaseReportGenerator {
  getPaymentType(): PaymentType {
    return 'prepaid';
  }
}