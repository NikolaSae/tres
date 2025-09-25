/*
  Warnings:

  - You are about to drop the column `providerId` on the `ParkingTransaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[provider_name,agreement_name,service_name,sender_name,datumNaplate]` on the table `BulkService` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `datumNaplate` to the `BulkService` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ParkingTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ParkingTransaction" DROP CONSTRAINT "ParkingTransaction_providerId_fkey";

-- DropIndex
DROP INDEX "BulkService_provider_name_agreement_name_service_name_sende_key";

-- AlterTable
ALTER TABLE "BulkService" ADD COLUMN     "datumNaplate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "HumanitarianOrg" ADD COLUMN     "bank" VARCHAR(100),
ADD COLUMN     "kratki_broj" VARCHAR(10),
ADD COLUMN     "maticni_broj" VARCHAR(13),
ADD COLUMN     "pib" VARCHAR(9),
ADD COLUMN     "tekuci_racun" VARCHAR(100);

-- AlterTable
ALTER TABLE "ParkingService" ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "ParkingTransaction" DROP COLUMN "providerId",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "VasTransaction" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "group" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VasTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportFile" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL,

    CONSTRAINT "ReportFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VasTransaction_providerId_date_idx" ON "VasTransaction"("providerId", "date");

-- CreateIndex
CREATE INDEX "VasTransaction_serviceId_idx" ON "VasTransaction"("serviceId");

-- CreateIndex
CREATE INDEX "VasTransaction_serviceCode_idx" ON "VasTransaction"("serviceCode");

-- CreateIndex
CREATE INDEX "VasTransaction_group_idx" ON "VasTransaction"("group");

-- CreateIndex
CREATE UNIQUE INDEX "VasTransaction_providerId_date_serviceName_group_key" ON "VasTransaction"("providerId", "date", "serviceName", "group");

-- CreateIndex
CREATE INDEX "ReportFile_organizationId_idx" ON "ReportFile"("organizationId");

-- CreateIndex
CREATE INDEX "ReportFile_startDate_idx" ON "ReportFile"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "BulkService_provider_name_agreement_name_service_name_sende_key" ON "BulkService"("provider_name", "agreement_name", "service_name", "sender_name", "datumNaplate");

-- CreateIndex
CREATE INDEX "HumanitarianOrg_pib_idx" ON "HumanitarianOrg"("pib");

-- AddForeignKey
ALTER TABLE "VasTransaction" ADD CONSTRAINT "VasTransaction_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VasTransaction" ADD CONSTRAINT "VasTransaction_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkingService" ADD CONSTRAINT "ParkingService_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportFile" ADD CONSTRAINT "ReportFile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "HumanitarianOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
