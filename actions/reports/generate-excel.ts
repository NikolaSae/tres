///actions/reports/generate-excel.ts


"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { canGenerateReports } from "@/lib/security/permission-checker";
import { revalidatePath } from "next/cache";
import { excelGenerator } from "@/lib/reports/excel-generator";
import { createActivityLog } from "@/lib/security/audit-logger";

export type ReportParams = {
  reportType: string;
  startDate?: Date;
  endDate?: Date;
  filters?: Record<string, any>;
  columns?: string[];
};

export type ReportResult = {
  fileUrl: string;
  reportName: string;
  generatedAt: Date;
  recordCount: number;
};

export async function generateExcelReport({
  reportType,
  startDate,
  endDate,
  filters = {},
  columns = [],
}: ReportParams): Promise<ReportResult> {
  const user = await currentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  // Check if the user has permission to generate reports
  const hasPermission = await canGenerateReports(user.id);
  if (!hasPermission) {
    throw new Error("You don't have permission to generate reports");
  }

  // Set default date range to last month if not provided
  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);

  const effectiveStartDate = startDate || defaultStartDate;
  const effectiveEndDate = endDate || defaultEndDate;

  // Define report configurations based on report type
  const reportConfigs: Record<string, { 
    query: Function, 
    formatData: Function,
    defaultColumns: string[],
    title: string
  }> = {
    "financial": {
      query: async () => {
        return await db.vasService.findMany({
          where: {
            mesec_pruzanja_usluge: {
              gte: effectiveStartDate,
              lte: effectiveEndDate,
            },
            ...filters,
          },
          include: {
            service: true,
            provider: true,
          },
          orderBy: {
            mesec_pruzanja_usluge: "desc",
          },
        });
      },
      formatData: (rawData: any[]) => {
        return rawData.map(item => ({
          Provider: item.provider.name,
          Product: item.proizvod,
          ServiceType: item.service.type,
          Month: item.mesec_pruzanja_usluge.toLocaleDateString(),
          UnitPrice: item.jedinicna_cena,
          Transactions: item.broj_transakcija,
          InvoicedAmount: item.fakturisan_iznos,
          CollectedAmount: item.naplacen_iznos,
          OutstandingAmount: item.nenaplacen_iznos,
          CanceledAmount: item.otkazan_iznos,
        }));
      },
      defaultColumns: [
        "Provider", "Product", "ServiceType", "Month", "UnitPrice", 
        "Transactions", "InvoicedAmount", "CollectedAmount", "OutstandingAmount"
      ],
      title: "Financial Report",
    },
    "complaints": {
      query: async () => {
        return await db.complaint.findMany({
          where: {
            createdAt: {
              gte: effectiveStartDate,
              lte: effectiveEndDate,
            },
            ...filters,
          },
          include: {
            service: true,
            product: true,
            provider: true,
            submittedBy: true,
            assignedAgent: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      },
      formatData: (rawData: any[]) => {
        return rawData.map(item => ({
          ID: item.id,
          Title: item.title,
          Status: item.status,
          Priority: item.priority,
          Service: item.service?.name || "N/A",
          Product: item.product?.name || "N/A",
          Provider: item.provider?.name || "N/A",
          SubmittedBy: item.submittedBy.name || item.submittedBy.email,
          AssignedTo: item.assignedAgent?.name || "Unassigned",
          CreatedAt: item.createdAt.toLocaleDateString(),
          ResolvedAt: item.resolvedAt?.toLocaleDateString() || "N/A",
          ResolutionTime: item.resolvedAt ? 
            Math.round((item.resolvedAt - item.createdAt) / (1000 * 60 * 60 * 24)) + " days" : 
            "N/A",
          FinancialImpact: item.financialImpact || 0,
        }));
      },
      defaultColumns: [
        "ID", "Title", "Status", "Priority", "Service", "Provider", 
        "SubmittedBy", "AssignedTo", "CreatedAt", "ResolvedAt", "ResolutionTime"
      ],
      title: "Complaints Report",
    },
    "contracts": {
      query: async () => {
        return await db.contract.findMany({
          where: {
            ...filters,
          },
          include: {
            provider: true,
            humanitarianOrg: true,
            parkingService: true,
            services: {
              include: {
                service: true,
              },
            },
            createdBy: true,
          },
          orderBy: {
            startDate: "desc",
          },
        });
      },
      formatData: (rawData: any[]) => {
        return rawData.map(item => {
          const contractType = item.type;
          let entityName = "N/A";
          
          switch (contractType) {
            case "PROVIDER":
              entityName = item.provider?.name || "N/A";
              break;
            case "HUMANITARIAN":
              entityName = item.humanitarianOrg?.name || "N/A";
              break;
            case "PARKING":
              entityName = item.parkingService?.name || "N/A";
              break;
          }
          
          const servicesList = item.services
            .map((s: any) => s.service.name)
            .join(", ");
          
          return {
            ContractNumber: item.contractNumber,
            Name: item.name,
            Type: item.type,
            EntityName: entityName,
            Status: item.status,
            StartDate: item.startDate.toLocaleDateString(),
            EndDate: item.endDate.toLocaleDateString(),
            RevenuePercentage: item.revenuePercentage + "%",
            Services: servicesList,
            CreatedBy: item.createdBy.name || item.createdBy.email,
            CreatedAt: item.createdAt.toLocaleDateString(),
            DaysUntilExpiration: Math.round((item.endDate - new Date()) / (1000 * 60 * 60 * 24)),
          };
        });
      },
      defaultColumns: [
        "ContractNumber", "Name", "Type", "EntityName", "Status", 
        "StartDate", "EndDate", "RevenuePercentage", "Services", "DaysUntilExpiration"
      ],
      title: "Contracts Report",
    },
  };

  // Check if the requested report type exists
  if (!reportConfigs[reportType]) {
    throw new Error(`Unsupported report type: ${reportType}`);
  }

  const config = reportConfigs[reportType];
  
  // Query data based on report type
  const rawData = await config.query();
  
  // Format the data for Excel
  const formattedData = config.formatData(rawData);
  
  // Determine which columns to include
  const effectiveColumns = columns.length > 0 ? columns : config.defaultColumns;
  
  // Generate report filename
  const dateStr = new Date().toISOString().split('T')[0];
  const reportName = `${config.title}_${dateStr}.xlsx`;
  
  // Generate Excel file
  const fileUrl = await excelGenerator({
    data: formattedData,
    columns: effectiveColumns,
    title: config.title,
    fileName: reportName,
  });
  
  // Log the report generation
  await createActivityLog({