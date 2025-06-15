////lib/types/analytics-types.ts


import { ServiceType } from "@prisma/client";

// Basic time range interface
export interface TimeRange {
  startDate: Date;
  endDate?: Date;
}

// Financial analytics interfaces
export interface FinancialMetric {
  revenue: number;
  costs: number;
  profit: number;
  profitMargin: number;
}

export interface FinancialTrend extends FinancialMetric {
  period: string; // Month/year or date string
}

export interface RevenueBreakdown {
  serviceType: ServiceType;
  revenue: number;
  percentage: number;
}

export interface ProviderRevenue {
  providerId: string;
  providerName: string;
  revenue: number;
  transactions: number;
  serviceCount: number;
}

export interface FinancialOverview {
  totalRevenue: number;
  totalProfit: number;
  averageProfitMargin: number;
  revenueBreakdown: RevenueBreakdown[];
  topProviders: ProviderRevenue[];
  monthlyTrend: FinancialTrend[];
}

// Sales analytics interfaces
export interface SalesMetric {
  transactions: number;
  volume: number;
  averageValue: number;
}

export interface ServicePerformance {
  serviceId: string;
  serviceName: string;
  serviceType: ServiceType;
  transactions: number;
  revenue: number;
  growth: number; // Percentage compared to previous period
}

export interface SalesOverview {
  totalTransactions: number;
  totalRevenue: number;
  averageTransactionValue: number;
  topServices: ServicePerformance[];
  monthlyTrend: Array<SalesMetric & { period: string }>;
}

// Complaint analytics interfaces
export interface ComplaintMetric {
  total: number;
  resolved: number;
  pending: number;
  avgResolutionTimeHours: number;
}

export interface ServiceComplaintRate {
  serviceId: string;
  serviceName: string;
  totalComplaints: number;
  resolvedComplaints: number;
  resolutionRate: number; // Percentage
}

export interface ComplaintOverview {
  totalComplaints: number;
  resolvedComplaints: number;
  resolutionRate: number; // Percentage
  avgResolutionTimeHours: number;
  complaintsByService: ServiceComplaintRate[];
  complaintsByPriority: Array<{ priority: number; count: number }>;
  monthlyTrend: Array<ComplaintMetric & { period: string }>;
}

// Provider analytics interfaces
export interface ProviderMetric {
  providerId: string;
  providerName: string;
  activeServices: number;
  revenue: number;
  transactions: number;
  complaintCount: number;
  complaintResolutionRate: number;
}

export interface ProviderPerformance {
  totalProviders: number;
  activeProviders: number;
  providerMetrics: ProviderMetric[];
  topPerformers: ProviderMetric[];
}

// Anomaly detection interfaces
export interface AnomalyThreshold {
  financialChange: number; // Percentage
  transactionCountChange: number; // Percentage
  complaintRateChange: number; // Percentage
}

export interface AnomalyDetection {
  entityId: string;
  entityName: string;
  entityType: string; // "service", "provider", etc.
  metricType: string; // "revenue", "transactions", "complaints"
  previousValue: number;
  currentValue: number;
  changePercentage: number;
  timestamp: Date;
}

// Report interfaces
export interface ReportFilter {
  startDate: Date;
  endDate?: Date;
  providerId?: string;
  serviceId?: string;
  serviceType?: ServiceType;
  productId?: string;
  contractType?: "PROVIDER" | "HUMANITARIAN" | "PARKING";
  complaintStatus?: "NEW" | "ASSIGNED" | "IN_PROGRESS" | "PENDING" | "RESOLVED" | "CLOSED" | "REJECTED";
}

export interface ReportOptions {
  reportType: "FINANCIAL" | "SALES" | "COMPLAINTS" | "CONTRACTS" | "PROVIDERS";
  format: "PDF" | "EXCEL" | "CSV";
  filters: ReportFilter;
  includeCharts: boolean;
}

export interface ScheduledReportConfig {
  id: string;
  name: string;
  description?: string;
  reportType: "FINANCIAL" | "SALES" | "COMPLAINTS" | "CONTRACTS" | "PROVIDERS";
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "ONCE";
  parameters?: {
    filters?: Partial<ReportFilter>;
    includeCharts?: boolean;
    recipients?: string[];
  };
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface GeneratedReport {
  id: string;
  name: string;
  reportType: string;
  fileUrl: string;
  generatedAt: Date;
  scheduledReportId?: string;
}

// KPI Dashboard interfaces
export interface KpiMetric {
  name: string;
  value: number | string;
  previousValue?: number | string;
  change?: number; // Percentage change
  trend?: "up" | "down" | "stable";
}

export interface KpiDashboard {
  financialMetrics: KpiMetric[];
  operationalMetrics: KpiMetric[];
  customerMetrics: KpiMetric[];
}