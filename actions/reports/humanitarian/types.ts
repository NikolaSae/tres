// /actions/reports/humanitarian/types.ts

export interface ReportGenerationResult {
  success: boolean;
  message: string;
  processed: number;
  errors?: string[];
  generatedFiles?: GeneratedFile[];
  unifiedReport?: UnifiedHumanitarianReport;
}

export interface GeneratedFile {
  organizationName: string;
  fileName: string;
  status: 'success' | 'error';
  message?: string;
}

export interface OrganizationData {
  id: string;
  name: string;
  accountNumber: string | null;
  pib: string | null;
  registrationNumber: string | null;
  shortNumber: string | null;
  mission: string | null;
  bank: string | null;
  activeContract?: ContractData | null;
}

export interface ContractData {
  name: string;
  contractNumber?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface OrganizationReportData extends Omit<OrganizationData, 'activeContract'> {
  contracts: Array<{
    name: string;
    contractNumber: string | null;
    startDate: Date | null;
  }>;
  monthlyRevenue?: number;
  totalTransactions?: number;
  serviceUsage?: {
    postpaid?: number;
    prepaid?: number;
  };
}

export interface CounterData {
  totalReports: number;
  validReportsCount: number;
  createdAt: string;
  lastUpdated: string;
  month: number;
  year: number;
  generationType: string;
  processedOrganizations: ProcessedOrganization[];
}

export interface ProcessedOrganization {
  name: string;
  timestamp: string;
  value: number;
  counterAssigned: number | null;
}

export interface DateParseResult {
  startDate: Date | null;
  endDate: Date | null;
  month: number | null;
  year: number | null;
  dayOfMonth?: number;
  isValid: boolean;
}

export interface CellUpdate {
  cell: string;
  value: any;
}

export interface UnifiedHumanitarianReport {
  success: boolean;
  totalOrganizations: number;
  path?: string;
  error?: string;
}




export type PaymentType = 'prepaid' | 'postpaid';
export type TemplateType = 'telekom' | 'globaltel';
export type GenerationType = 'templates' | 'complete-reports';