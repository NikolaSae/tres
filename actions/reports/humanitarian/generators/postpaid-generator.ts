//  /actions/reports/humanitarian/generators/postpaid-generator.ts

import { PaymentType } from '../types';
import { BaseReportGenerator } from './base-generator';

export class PostpaidReportGenerator extends BaseReportGenerator {
  getPaymentType(): PaymentType {
    return 'postpaid';
  }
}