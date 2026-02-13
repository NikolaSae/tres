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

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
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

// Legacy PascalCase aliases (import needed for local references)
import { newPasswordSchema as _newPasswordSchema, loginSchema as _loginSchema, registerSchema as _registerSchema, resetPasswordSchema as _resetPasswordSchema } from './auth';
export const NewPasswordSchema = _newPasswordSchema;
export const LoginSchemaLegacy = _loginSchema;
export const RegisterSchemaLegacy = _registerSchema;
export const ResetSchemaLegacy = _resetPasswordSchema;


// Operator and Security schemas are re-exported via "export *" below

export const SettingsSchema = z
  .object({
    name: z.optional(z.string()),
    isTwoFactorEnabled: z.optional(z.boolean()),
    role: z.enum([UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT, UserRole.USER]), // Dodati svi UserRole vrednosti
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

// Additional type aliases (types already exported via "export *" from sub-files above)
// Only add aliases here if you need a DIFFERENT name than what the sub-file exports