////schemas/analytics.ts


import { z } from "zod";

// Analytics time range validation schema
export const AnalyticsTimeRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().default(() => new Date()),
});

// Financial analytics filter schema
export const FinancialAnalyticsFilterSchema = z.object({
  ...AnalyticsTimeRangeSchema.shape,
  providerId: z.string().optional(),
  serviceId: z.string().optional(),
  serviceType: z.enum(["VAS", "BULK", "HUMANITARIAN", "PARKING"]).optional(),
});

// Sales analytics filter schema
export const SalesAnalyticsFilterSchema = z.object({
  ...AnalyticsTimeRangeSchema.shape,
  providerId: z.string().optional(),
  serviceId: z.string().optional(),
  productId: z.string().optional(),
});

// Complaint analytics filter schema
export const ComplaintAnalyticsFilterSchema = z.object({
  ...AnalyticsTimeRangeSchema.shape,
  status: z.enum([
    "NEW", 
    "ASSIGNED", 
    "IN_PROGRESS", 
    "PENDING", 
    "RESOLVED", 
    "CLOSED", 
    "REJECTED"
  ]).optional(),
  providerId: z.string().optional(),
  serviceId: z.string().optional(),
  productId: z.string().optional(),
  priority: z.number().min(1).max(5).optional(),
});

// Provider analytics filter schema
export const ProviderAnalyticsFilterSchema = z.object({
  ...AnalyticsTimeRangeSchema.shape,
  providerId: z.string().optional(),
  serviceType: z.enum(["VAS", "BULK", "HUMANITARIAN", "PARKING"]).optional(),
});

// Report generation schema
export const ReportGenerationSchema = z.object({
  reportType: z.enum([
    "FINANCIAL",
    "SALES",
    "COMPLAINTS",
    "CONTRACTS",
    "PROVIDERS",
  ]),
  format: z.enum(["PDF", "EXCEL", "CSV"]),
  filters: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    providerId: z.string().optional(),
    serviceId: z.string().optional(),
    serviceType: z.enum(["VAS", "BULK", "HUMANITARIAN", "PARKING"]).optional(),
    productId: z.string().optional(),
    contractType: z.enum(["PROVIDER", "HUMANITARIAN", "PARKING"]).optional(),
    complaintStatus: z.enum([
      "NEW", 
      "ASSIGNED", 
      "IN_PROGRESS", 
      "PENDING", 
      "RESOLVED", 
      "CLOSED", 
      "REJECTED"
    ]).optional(),
  }),
  includeCharts: z.boolean().default(true),
});

// Anomaly detection threshold schema
export const AnomalyThresholdSchema = z.object({
  financialChange: z.number().min(0).max(100).default(20), // Percentage threshold
  transactionCountChange: z.number().min(0).max(100).default(30), // Percentage threshold
  complaintRateChange: z.number().min(0).max(100).default(50), // Percentage threshold
});

// Scheduled report schema
export const ScheduledReportSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  reportType: z.enum([
    "FINANCIAL",
    "SALES",
    "COMPLAINTS",
    "CONTRACTS",
    "PROVIDERS",
  ]),
  frequency: z.enum([
    "DAILY",
    "WEEKLY",
    "MONTHLY",
    "QUARTERLY",
    "YEARLY",
    "ONCE",
  ]),
  parameters: z.object({
    filters: z.object({
      providerId: z.string().optional(),
      serviceId: z.string().optional(),
      serviceType: z.enum(["VAS", "BULK", "HUMANITARIAN", "PARKING"]).optional(),
      productId: z.string().optional(),
      contractType: z.enum(["PROVIDER", "HUMANITARIAN", "PARKING"]).optional(),
      complaintStatus: z.enum([
        "NEW", 
        "ASSIGNED", 
        "IN_PROGRESS", 
        "PENDING", 
        "RESOLVED", 
        "CLOSED", 
        "REJECTED"
      ]).optional(),
    }).optional(),
    includeCharts: z.boolean().default(true),
    recipients: z.array(z.string().email()).optional(),
  }).optional(),
  isActive: z.boolean().default(true),
});