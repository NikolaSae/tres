/*
  Warnings:

  - Added the required column `reportType` to the `ReportFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ReportFile" ADD COLUMN     "reportType" TEXT NOT NULL;
