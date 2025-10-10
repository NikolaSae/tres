-- AlterTable
ALTER TABLE "public"."ParkingService" ADD COLUMN     "lastReportSentAt" TIMESTAMP(3),
ADD COLUMN     "reportSendHistory" JSONB[],
ADD COLUMN     "totalReportsSent" INTEGER NOT NULL DEFAULT 0;
