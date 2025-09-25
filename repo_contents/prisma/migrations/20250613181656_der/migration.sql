-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'AGENT', 'USER');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'PENDING', 'RENEWAL_IN_PROGRESS', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('PROVIDER', 'HUMANITARIAN', 'PARKING', 'BULK');

-- CreateEnum
CREATE TYPE "ContractRenewalSubStatus" AS ENUM ('DOCUMENT_COLLECTION', 'LEGAL_REVIEW', 'FINANCIAL_APPROVAL', 'AWAITING_SIGNATURE', 'FINAL_PROCESSING', 'TECHNICAL_REVIEW', 'MANAGEMENT_APPROVAL');

-- CreateEnum
CREATE TYPE "HumanitarianRenewalSubStatus" AS ENUM ('DOCUMENT_COLLECTION', 'LEGAL_REVIEW', 'FINANCIAL_APPROVAL', 'AWAITING_SIGNATURE', 'FINAL_PROCESSING');

-- CreateEnum
CREATE TYPE "LogBlackType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'DEACTIVATE');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('VAS', 'BULK', 'HUMANITARIAN', 'PARKING');

-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('PREPAID', 'POSTPAID');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LogActionType" AS ENUM ('ACTIVATION', 'DEACTIVATION', 'STATUS_CHANGE', 'NOTE');

-- CreateEnum
CREATE TYPE "LogStatus" AS ENUM ('IN_PROGRESS', 'FINISHED');

-- CreateEnum
CREATE TYPE "LogEntityType" AS ENUM ('PROVIDER', 'PARKING_SERVICE', 'BULK_SERVICE');

-- CreateEnum
CREATE TYPE "LogSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CONTRACT_EXPIRING', 'CONTRACT_RENEWAL_STATUS_CHANGE', 'COMPLAINT_ASSIGNED', 'COMPLAINT_UPDATED', 'REMINDER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ReportFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'ONCE');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "two_factor_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactorConfirmation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TwoFactorConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "image" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanitarianOrg" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "website" TEXT,
    "mission" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HumanitarianOrg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParkingTransaction" (
    "id" TEXT NOT NULL,
    "parkingServiceId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "group" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "ParkingTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParkingService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "additionalEmails" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "originalFileName" TEXT,
    "originalFilePath" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "lastImportDate" TIMESTAMP(3),
    "importedBy" TEXT,
    "importStatus" TEXT,

    CONSTRAINT "ParkingService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "type" "ContractType" NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "revenuePercentage" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "operatorRevenue" DOUBLE PRECISION,
    "isRevenueSharing" BOOLEAN NOT NULL DEFAULT true,
    "operatorId" TEXT,
    "providerId" TEXT,
    "humanitarianOrgId" TEXT,
    "parkingServiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "lastModifiedById" TEXT,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractRenewal" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "subStatus" "ContractRenewalSubStatus" NOT NULL DEFAULT 'DOCUMENT_COLLECTION',
    "renewalStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proposedStartDate" TIMESTAMP(3) NOT NULL,
    "proposedEndDate" TIMESTAMP(3) NOT NULL,
    "proposedRevenue" DOUBLE PRECISION,
    "documentsReceived" BOOLEAN NOT NULL DEFAULT false,
    "legalApproved" BOOLEAN NOT NULL DEFAULT false,
    "financialApproved" BOOLEAN NOT NULL DEFAULT false,
    "technicalApproved" BOOLEAN NOT NULL DEFAULT false,
    "managementApproved" BOOLEAN NOT NULL DEFAULT false,
    "signatureReceived" BOOLEAN NOT NULL DEFAULT false,
    "comments" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "lastModifiedById" TEXT,

    CONSTRAINT "ContractRenewal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractRenewalAttachment" (
    "id" TEXT NOT NULL,
    "renewalId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ContractRenewalAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanitarianContractRenewal" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "humanitarianOrgId" TEXT NOT NULL,
    "subStatus" "HumanitarianRenewalSubStatus" NOT NULL DEFAULT 'DOCUMENT_COLLECTION',
    "renewalStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proposedStartDate" TIMESTAMP(3) NOT NULL,
    "proposedEndDate" TIMESTAMP(3) NOT NULL,
    "proposedRevenue" DOUBLE PRECISION NOT NULL,
    "documentsReceived" BOOLEAN NOT NULL DEFAULT false,
    "legalApproved" BOOLEAN NOT NULL DEFAULT false,
    "financialApproved" BOOLEAN NOT NULL DEFAULT false,
    "signatureReceived" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "lastModifiedById" TEXT,

    CONSTRAINT "HumanitarianContractRenewal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SenderBlacklist" (
    "id" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "matchCount" INTEGER NOT NULL DEFAULT 0,
    "lastMatchDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "modifiedById" TEXT,

    CONSTRAINT "SenderBlacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlacklistLog" (
    "id" TEXT NOT NULL,
    "action" "LogBlackType" NOT NULL,
    "entityId" TEXT,
    "entityType" TEXT NOT NULL DEFAULT 'SenderBlacklist',
    "oldData" JSONB,
    "newData" JSONB,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlacklistLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceContract" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "specificTerms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractAttachment" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT NOT NULL,

    CONSTRAINT "ContractAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractReminder" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "reminderDate" TIMESTAMP(3) NOT NULL,
    "reminderType" TEXT NOT NULL,
    "isAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ServiceType" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "billingType" "BillingType",

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VasService" (
    "id" TEXT NOT NULL,
    "proizvod" TEXT NOT NULL,
    "mesec_pruzanja_usluge" TIMESTAMP(3) NOT NULL,
    "jedinicna_cena" DOUBLE PRECISION NOT NULL,
    "broj_transakcija" INTEGER NOT NULL,
    "fakturisan_iznos" DOUBLE PRECISION NOT NULL,
    "fakturisan_korigovan_iznos" DOUBLE PRECISION NOT NULL,
    "naplacen_iznos" DOUBLE PRECISION NOT NULL,
    "kumulativ_naplacenih_iznosa" DOUBLE PRECISION NOT NULL,
    "nenaplacen_iznos" DOUBLE PRECISION NOT NULL,
    "nenaplacen_korigovan_iznos" DOUBLE PRECISION NOT NULL,
    "storniran_iznos" DOUBLE PRECISION NOT NULL,
    "otkazan_iznos" DOUBLE PRECISION NOT NULL,
    "kumulativ_otkazanih_iznosa" DOUBLE PRECISION NOT NULL,
    "iznos_za_prenos_sredstava" DOUBLE PRECISION NOT NULL,
    "serviceId" TEXT NOT NULL,
    "provajderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VasService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkService" (
    "id" TEXT NOT NULL,
    "provider_name" TEXT NOT NULL,
    "agreement_name" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "step_name" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "requests" INTEGER NOT NULL,
    "message_parts" INTEGER NOT NULL,
    "serviceId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'NEW',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "financialImpact" DOUBLE PRECISION,
    "serviceId" TEXT,
    "productId" TEXT,
    "providerId" TEXT,
    "submittedById" TEXT NOT NULL,
    "assignedAgentId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "humanitarianOrgId" TEXT,
    "parkingServiceId" TEXT,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintStatusHistory" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "previousStatus" "ComplaintStatus",
    "newStatus" "ComplaintStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "ComplaintStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL,
    "entityType" "LogEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "LogActionType" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "status" "LogStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "sendEmail" BOOLEAN NOT NULL DEFAULT false,
    "providerId" TEXT,
    "parkingServiceId" TEXT,
    "bulkServiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "LogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "severity" "LogSeverity" NOT NULL DEFAULT 'INFO',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportType" TEXT NOT NULL,
    "frequency" "ReportFrequency" NOT NULL,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3),
    "parameters" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledReportId" TEXT,

    CONSTRAINT "GeneratedReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferences" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_email_token_key" ON "verification_tokens"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_email_token_key" ON "password_reset_tokens"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_tokens_token_key" ON "two_factor_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_tokens_email_token_key" ON "two_factor_tokens"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorConfirmation_userId_key" ON "TwoFactorConfirmation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_name_key" ON "Provider"("name");

-- CreateIndex
CREATE INDEX "Provider_name_idx" ON "Provider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HumanitarianOrg_name_key" ON "HumanitarianOrg"("name");

-- CreateIndex
CREATE INDEX "HumanitarianOrg_name_idx" ON "HumanitarianOrg"("name");

-- CreateIndex
CREATE INDEX "ParkingTransaction_parkingServiceId_date_serviceName_idx" ON "ParkingTransaction"("parkingServiceId", "date", "serviceName");

-- CreateIndex
CREATE UNIQUE INDEX "ParkingTransaction_parkingServiceId_date_serviceName_group_key" ON "ParkingTransaction"("parkingServiceId", "date", "serviceName", "group");

-- CreateIndex
CREATE INDEX "ParkingService_name_idx" ON "ParkingService"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contractNumber_key" ON "Contract"("contractNumber");

-- CreateIndex
CREATE INDEX "Contract_providerId_idx" ON "Contract"("providerId");

-- CreateIndex
CREATE INDEX "Contract_humanitarianOrgId_idx" ON "Contract"("humanitarianOrgId");

-- CreateIndex
CREATE INDEX "Contract_parkingServiceId_idx" ON "Contract"("parkingServiceId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_endDate_idx" ON "Contract"("endDate");

-- CreateIndex
CREATE INDEX "Contract_operatorId_idx" ON "Contract"("operatorId");

-- CreateIndex
CREATE INDEX "ContractRenewal_contractId_idx" ON "ContractRenewal"("contractId");

-- CreateIndex
CREATE INDEX "ContractRenewal_subStatus_idx" ON "ContractRenewal"("subStatus");

-- CreateIndex
CREATE INDEX "ContractRenewal_proposedStartDate_idx" ON "ContractRenewal"("proposedStartDate");

-- CreateIndex
CREATE INDEX "ContractRenewal_renewalStartDate_idx" ON "ContractRenewal"("renewalStartDate");

-- CreateIndex
CREATE INDEX "ContractRenewalAttachment_renewalId_idx" ON "ContractRenewalAttachment"("renewalId");

-- CreateIndex
CREATE INDEX "ContractRenewalAttachment_uploadedAt_idx" ON "ContractRenewalAttachment"("uploadedAt");

-- CreateIndex
CREATE INDEX "HumanitarianContractRenewal_contractId_idx" ON "HumanitarianContractRenewal"("contractId");

-- CreateIndex
CREATE INDEX "HumanitarianContractRenewal_humanitarianOrgId_idx" ON "HumanitarianContractRenewal"("humanitarianOrgId");

-- CreateIndex
CREATE INDEX "HumanitarianContractRenewal_subStatus_idx" ON "HumanitarianContractRenewal"("subStatus");

-- CreateIndex
CREATE INDEX "HumanitarianContractRenewal_proposedStartDate_idx" ON "HumanitarianContractRenewal"("proposedStartDate");

-- CreateIndex
CREATE INDEX "SenderBlacklist_senderName_idx" ON "SenderBlacklist"("senderName");

-- CreateIndex
CREATE INDEX "SenderBlacklist_effectiveDate_idx" ON "SenderBlacklist"("effectiveDate");

-- CreateIndex
CREATE INDEX "SenderBlacklist_isActive_idx" ON "SenderBlacklist"("isActive");

-- CreateIndex
CREATE INDEX "BlacklistLog_action_idx" ON "BlacklistLog"("action");

-- CreateIndex
CREATE INDEX "BlacklistLog_entityId_idx" ON "BlacklistLog"("entityId");

-- CreateIndex
CREATE INDEX "BlacklistLog_timestamp_idx" ON "BlacklistLog"("timestamp");

-- CreateIndex
CREATE INDEX "BlacklistLog_userId_idx" ON "BlacklistLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Operator_code_key" ON "Operator"("code");

-- CreateIndex
CREATE INDEX "ServiceContract_contractId_idx" ON "ServiceContract"("contractId");

-- CreateIndex
CREATE INDEX "ServiceContract_serviceId_idx" ON "ServiceContract"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceContract_contractId_serviceId_key" ON "ServiceContract"("contractId", "serviceId");

-- CreateIndex
CREATE INDEX "ContractAttachment_contractId_idx" ON "ContractAttachment"("contractId");

-- CreateIndex
CREATE INDEX "ContractReminder_contractId_idx" ON "ContractReminder"("contractId");

-- CreateIndex
CREATE INDEX "ContractReminder_reminderDate_idx" ON "ContractReminder"("reminderDate");

-- CreateIndex
CREATE INDEX "ContractReminder_isAcknowledged_idx" ON "ContractReminder"("isAcknowledged");

-- CreateIndex
CREATE INDEX "Service_type_idx" ON "Service"("type");

-- CreateIndex
CREATE INDEX "Service_name_idx" ON "Service"("name");

-- CreateIndex
CREATE INDEX "VasService_serviceId_idx" ON "VasService"("serviceId");

-- CreateIndex
CREATE INDEX "VasService_provajderId_idx" ON "VasService"("provajderId");

-- CreateIndex
CREATE INDEX "VasService_mesec_pruzanja_usluge_idx" ON "VasService"("mesec_pruzanja_usluge");

-- CreateIndex
CREATE UNIQUE INDEX "VasService_proizvod_mesec_pruzanja_usluge_provajderId_key" ON "VasService"("proizvod", "mesec_pruzanja_usluge", "provajderId");

-- CreateIndex
CREATE INDEX "BulkService_serviceId_idx" ON "BulkService"("serviceId");

-- CreateIndex
CREATE INDEX "BulkService_providerId_idx" ON "BulkService"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "BulkService_provider_name_agreement_name_service_name_sende_key" ON "BulkService"("provider_name", "agreement_name", "service_name", "sender_name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_code_idx" ON "Product"("code");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_serviceId_idx" ON "Complaint"("serviceId");

-- CreateIndex
CREATE INDEX "Complaint_productId_idx" ON "Complaint"("productId");

-- CreateIndex
CREATE INDEX "Complaint_providerId_idx" ON "Complaint"("providerId");

-- CreateIndex
CREATE INDEX "Complaint_submittedById_idx" ON "Complaint"("submittedById");

-- CreateIndex
CREATE INDEX "Complaint_assignedAgentId_idx" ON "Complaint"("assignedAgentId");

-- CreateIndex
CREATE INDEX "Complaint_createdAt_idx" ON "Complaint"("createdAt");

-- CreateIndex
CREATE INDEX "Complaint_priority_idx" ON "Complaint"("priority");

-- CreateIndex
CREATE INDEX "Complaint_humanitarianOrgId_idx" ON "Complaint"("humanitarianOrgId");

-- CreateIndex
CREATE INDEX "ComplaintStatusHistory_complaintId_idx" ON "ComplaintStatusHistory"("complaintId");

-- CreateIndex
CREATE INDEX "ComplaintStatusHistory_changedAt_idx" ON "ComplaintStatusHistory"("changedAt");

-- CreateIndex
CREATE INDEX "Comment_complaintId_idx" ON "Comment"("complaintId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_isInternal_idx" ON "Comment"("isInternal");

-- CreateIndex
CREATE INDEX "Attachment_complaintId_idx" ON "Attachment"("complaintId");

-- CreateIndex
CREATE INDEX "LogEntry_entityType_entityId_idx" ON "LogEntry"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "LogEntry_providerId_idx" ON "LogEntry"("providerId");

-- CreateIndex
CREATE INDEX "LogEntry_parkingServiceId_idx" ON "LogEntry"("parkingServiceId");

-- CreateIndex
CREATE INDEX "LogEntry_bulkServiceId_idx" ON "LogEntry"("bulkServiceId");

-- CreateIndex
CREATE INDEX "LogEntry_createdById_idx" ON "LogEntry"("createdById");

-- CreateIndex
CREATE INDEX "LogEntry_createdAt_idx" ON "LogEntry"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_idx" ON "ActivityLog"("entityType");

-- CreateIndex
CREATE INDEX "ActivityLog_entityId_idx" ON "ActivityLog"("entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_severity_idx" ON "ActivityLog"("severity");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "ScheduledReport_reportType_idx" ON "ScheduledReport"("reportType");

-- CreateIndex
CREATE INDEX "ScheduledReport_frequency_idx" ON "ScheduledReport"("frequency");

-- CreateIndex
CREATE INDEX "ScheduledReport_nextRun_idx" ON "ScheduledReport"("nextRun");

-- CreateIndex
CREATE INDEX "ScheduledReport_isActive_idx" ON "ScheduledReport"("isActive");

-- CreateIndex
CREATE INDEX "GeneratedReport_reportType_idx" ON "GeneratedReport"("reportType");

-- CreateIndex
CREATE INDEX "GeneratedReport_generatedAt_idx" ON "GeneratedReport"("generatedAt");

-- CreateIndex
CREATE INDEX "GeneratedReport_scheduledReportId_idx" ON "GeneratedReport"("scheduledReportId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwoFactorConfirmation" ADD CONSTRAINT "TwoFactorConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkingTransaction" ADD CONSTRAINT "ParkingTransaction_parkingServiceId_fkey" FOREIGN KEY ("parkingServiceId") REFERENCES "ParkingService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkingTransaction" ADD CONSTRAINT "ParkingTransaction_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_humanitarianOrgId_fkey" FOREIGN KEY ("humanitarianOrgId") REFERENCES "HumanitarianOrg"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_parkingServiceId_fkey" FOREIGN KEY ("parkingServiceId") REFERENCES "ParkingService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_lastModifiedById_fkey" FOREIGN KEY ("lastModifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractRenewal" ADD CONSTRAINT "ContractRenewal_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractRenewal" ADD CONSTRAINT "ContractRenewal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractRenewal" ADD CONSTRAINT "ContractRenewal_lastModifiedById_fkey" FOREIGN KEY ("lastModifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractRenewalAttachment" ADD CONSTRAINT "ContractRenewalAttachment_renewalId_fkey" FOREIGN KEY ("renewalId") REFERENCES "ContractRenewal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractRenewalAttachment" ADD CONSTRAINT "ContractRenewalAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanitarianContractRenewal" ADD CONSTRAINT "HumanitarianContractRenewal_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanitarianContractRenewal" ADD CONSTRAINT "HumanitarianContractRenewal_humanitarianOrgId_fkey" FOREIGN KEY ("humanitarianOrgId") REFERENCES "HumanitarianOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanitarianContractRenewal" ADD CONSTRAINT "HumanitarianContractRenewal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanitarianContractRenewal" ADD CONSTRAINT "HumanitarianContractRenewal_lastModifiedById_fkey" FOREIGN KEY ("lastModifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SenderBlacklist" ADD CONSTRAINT "SenderBlacklist_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SenderBlacklist" ADD CONSTRAINT "SenderBlacklist_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlacklistLog" ADD CONSTRAINT "BlacklistLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlacklistLog" ADD CONSTRAINT "BlacklistLog_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "SenderBlacklist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceContract" ADD CONSTRAINT "ServiceContract_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceContract" ADD CONSTRAINT "ServiceContract_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractAttachment" ADD CONSTRAINT "ContractAttachment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractAttachment" ADD CONSTRAINT "ContractAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractReminder" ADD CONSTRAINT "ContractReminder_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractReminder" ADD CONSTRAINT "ContractReminder_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VasService" ADD CONSTRAINT "VasService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VasService" ADD CONSTRAINT "VasService_provajderId_fkey" FOREIGN KEY ("provajderId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkService" ADD CONSTRAINT "BulkService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkService" ADD CONSTRAINT "BulkService_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_humanitarianOrgId_fkey" FOREIGN KEY ("humanitarianOrgId") REFERENCES "HumanitarianOrg"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_parkingServiceId_fkey" FOREIGN KEY ("parkingServiceId") REFERENCES "ParkingService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintStatusHistory" ADD CONSTRAINT "ComplaintStatusHistory_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_parkingServiceId_fkey" FOREIGN KEY ("parkingServiceId") REFERENCES "ParkingService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_bulkServiceId_fkey" FOREIGN KEY ("bulkServiceId") REFERENCES "BulkService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
