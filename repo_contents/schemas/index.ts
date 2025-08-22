
//schemas/index.ts


import { UserRole } from "@prisma/client";
import * as z from "zod";

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
  code: z.optional(z.string()),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
  name: z.string().min(1, {
    message: "Name is required",
  }),
});

// schemas/index.ts - Export all schemas from a central location

// Auth schemas
export {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  newPasswordSchema,
  changePasswordSchema,
  profileUpdateSchema,
  userRoleUpdateSchema,
  userActivationSchema,
  verifyEmailSchema,
  twoFactorSetupSchema,
  twoFactorVerificationSchema,
  type LoginFormData,
  type RegisterFormData,
  type ResetPasswordFormData,
  type NewPasswordFormData,
  type ChangePasswordFormData,
  type ProfileUpdateFormData,
  type UserRoleUpdateFormData,
  type UserActivationFormData,
  type VerifyEmailFormData,
  type TwoFactorSetupFormData,
  type TwoFactorVerificationFormData,
} from './auth';


// Operator schemas
export {
  operatorSchema,
  operatorFilterSchema,
  operatorUpdateSchema,
  operatorActivationSchema,
  operatorBulkOperationSchema,
  operatorImportSchema,
  operatorExportSchema,
  type OperatorFormData,
  type OperatorFilterData,
  type OperatorUpdateData,
  type OperatorActivationData,
  type OperatorBulkOperationData,
  type OperatorImportData,
  type OperatorExportData,
} from './operator';

// Security schemas
export {
  ActivityLogSchema,
  ActivityLogFilterSchema,
  PermissionSchema,
  RolePermissionSchema,
  RateLimitSchema,
  BackupConfigSchema,
  SecurityPolicySchema,
  SecurityLogExportSchema,
  PerformanceMetricSchema,
} from './security';

// You can add more schema exports here as you create them
// Contract schemas (when you create them)
// export { contractSchema, ... } from './contract';


export const SettingsSchema = z
  .object({
    name: z.optional(z.string()),
    isTwoFactorEnabled: z.optional(z.boolean()),
    role: z.enum([UserRole.ADMIN, UserRole.USER]),
    email: z.optional(z.string().email()),
    password: z.optional(z.string().min(6)),
    newPassword: z.optional(z.string().min(6)),
  })
  .refine(
    (data) => {
      if (data.password && !data.newPassword) {
        return false;
      }
      return true;
    },
    {
      message: "New password is required",
      path: ["newPassword"],
    }
  )
  .refine(
    (data) => {
      if (data.newPassword && !data.password) {
        return false;
      }
      return true;
    },
    {
      message: "Password is required",
      path: ["password"],
    }
  );

// Import i re-export svih schema fajlova
export * from "./analytics";
export * from "./bulk-service";
export * from "./complaint";
export * from "./contract-attachment";
export * from "./contract-reminder";
export * from "./contract";
export * from "./humanitarian-org";
export * from "./humanitarian-renewal";
export * from "./notification";
export * from "./operator";
export * from "./parking-service";
export * from "./product";
export * from "./provider";
export * from "./security";
export * from "./service";

// Type exports za auth scheme
export type LoginFormValues = z.infer<typeof LoginSchema>;
export type RegisterFormValues = z.infer<typeof RegisterSchema>;
export type ResetFormValues = z.infer<typeof ResetSchema>;
export type NewPasswordFormValues = z.infer<typeof NewPasswordSchema>;
export type SettingsFormValues = z.infer<typeof SettingsSchema>;

// Type exports za analytics scheme
export type AnalyticsTimeRange = z.infer<typeof AnalyticsTimeRangeSchema>;
export type FinancialAnalyticsFilter = z.infer<typeof FinancialAnalyticsFilterSchema>;
export type SalesAnalyticsFilter = z.infer<typeof SalesAnalyticsFilterSchema>;
export type ComplaintAnalyticsFilter = z.infer<typeof ComplaintAnalyticsFilterSchema>;
export type ProviderAnalyticsFilter = z.infer<typeof ProviderAnalyticsFilterSchema>;
export type ReportGeneration = z.infer<typeof ReportGenerationSchema>;
export type AnomalyThreshold = z.infer<typeof AnomalyThresholdSchema>;
export type ScheduledReport = z.infer<typeof ScheduledReportSchema>;

// Type exports za bulk service scheme
export type BulkServiceFormData = z.infer<typeof bulkServiceSchema>;
export type BulkServiceUpdateData = z.infer<typeof bulkServiceUpdateSchema>;
export type BulkServiceFiltersData = z.infer<typeof bulkServiceFiltersSchema>;
export type BulkServiceCSVRow = z.infer<typeof bulkServiceCSVRowSchema>;
export type BulkServiceSearchParams = z.infer<typeof bulkServiceSearchParamsSchema>;

// Type exports za complaint scheme
export type ComplaintFormData = z.infer<typeof ComplaintSchema>;
export type ComplaintUpdateData = z.infer<typeof complaintUpdateSchema>;
export type ComplaintStatusUpdate = z.infer<typeof ComplaintStatusUpdateSchema>;
export type ComplaintComment = z.infer<typeof ComplaintCommentSchema>;
export type ComplaintFilter = z.infer<typeof ComplaintFilterSchema>;

// Type exports za contract attachment scheme
export type ContractAttachmentData = z.infer<typeof contractAttachmentSchema>;

// Type exports za contract reminder scheme
export type CreateContractReminderData = z.infer<typeof createContractReminderSchema>;
export type AcknowledgeContractReminderData = z.infer<typeof acknowledgeContractReminderSchema>;

// Type exports za contract scheme
export type ContractFormData = z.infer<typeof contractSchema>;

// Type exports za humanitarian org scheme
export type HumanitarianOrgFormData = z.infer<typeof humanitarianOrgSchema>;

// Type exports za humanitarian renewal scheme
export type CreateHumanitarianRenewalInput = z.infer<typeof createHumanitarianRenewalSchema>;
export type UpdateHumanitarianRenewalInput = z.infer<typeof updateHumanitarianRenewalSchema>;
export type RenewalFilters = z.infer<typeof renewalFiltersSchema>;
export type HumanitarianRenewalSubStatus = z.infer<typeof HumanitarianRenewalSubStatusEnum>;

// Type exports za notification scheme
export type NotificationData = z.infer<typeof NotificationSchema>;
export type CreateNotificationData = z.infer<typeof CreateNotificationSchema>;
export type UpdateNotificationData = z.infer<typeof UpdateNotificationSchema>;
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;
export type PushNotificationData = z.infer<typeof PushNotificationSchema>;
export type BulkNotificationData = z.infer<typeof BulkNotificationSchema>;
export type AlertThreshold = z.infer<typeof AlertThresholdSchema>;

// Type exports za operator scheme
export type OperatorFormData = z.infer<typeof operatorSchema>;

// Type exports za parking service scheme
export type ParkingServiceFiltersData = z.infer<typeof ParkingServiceFiltersInput>;
export type CreateParkingServiceData = z.infer<typeof CreateParkingServiceInput>;
export type UpdateParkingServiceData = z.infer<typeof UpdateParkingServiceInput>;

// Type exports za product scheme
export type ProductFormData = z.infer<typeof productSchema>;
export type ProductUpdateData = z.infer<typeof productUpdateSchema>;
export type ProductFilterData = z.infer<typeof productFilterSchema>;

// Type exports za provider scheme
export type ProviderFormData = z.infer<typeof providerSchema>;

// Type exports za security scheme
export type ActivityLogData = z.infer<typeof ActivityLogSchema>;
export type ActivityLogFilter = z.infer<typeof ActivityLogFilterSchema>;
export type PermissionData = z.infer<typeof PermissionSchema>;
export type RolePermissionData = z.infer<typeof RolePermissionSchema>;
export type RateLimitData = z.infer<typeof RateLimitSchema>;
export type BackupConfigData = z.infer<typeof BackupConfigSchema>;
export type SecurityPolicyData = z.infer<typeof SecurityPolicySchema>;
export type SecurityLogExportData = z.infer<typeof SecurityLogExportSchema>;
export type PerformanceMetricData = z.infer<typeof PerformanceMetricSchema>;

// Type exports za service scheme
export type ServiceFormData = z.infer<typeof serviceSchema>;
export type ServiceUpdateData = z.infer<typeof serviceUpdateSchema>;
export type ServiceFilterData = z.infer<typeof serviceFilterSchema>;

// Complaint schemas (when you create them)  
// export { complaintSchema, ... } from './complaint';

