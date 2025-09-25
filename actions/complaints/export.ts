// /actions/complaints/export.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ComplaintStatus } from "@prisma/client";
import { formatDate } from "@/utils/date-filters";

export type ExportFormat = "csv" | "json" | "excel";

export type ExportOptions = {
  format: ExportFormat;
  dateRange?: {
    from: Date;
    to: Date;
  };
  statuses?: ComplaintStatus[];
  serviceId?: string;
  providerId?: string;
  productId?: string;
};

export async function exportComplaints(options: ExportOptions): Promise<string> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized access");
  }

  // Build filter criteria
  const where: any = {};
  
  if (options.dateRange) {
    where.createdAt = {
      gte: options.dateRange.from,
      lte: options.dateRange.to,
    };
  }
  
  if (options.statuses && options.statuses.length > 0) {
    where.status = {
      in: options.statuses,
    };
  }
  
  if (options.serviceId) {
    where.serviceId = options.serviceId;
  }
  
  if (options.providerId) {
    where.providerId = options.providerId;
  }
  
  if (options.productId) {
    where.productId = options.productId;
  }

  // Fetch complaints with relations
  const complaints = await db.complaint.findMany({
    where,
    include: {
      service: {
        select: {
          name: true,
        },
      },
      product: {
        select: {
          name: true,
          code: true,
        },
      },
      provider: {
        select: {
          name: true,
        },
      },
      submittedBy: {
        select: {
          name: true,
          email: true,
        },
      },
      assignedAgent: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform data for export
  const exportData = complaints.map((complaint) => ({
    id: complaint.id,
    title: complaint.title,
    description: complaint.description,
    status: complaint.status,
    priority: complaint.priority,
    createdAt: formatDate(complaint.createdAt),
    updatedAt: formatDate(complaint.updatedAt),
    resolvedAt: complaint.resolvedAt ? formatDate(complaint.resolvedAt) : null,
    closedAt: complaint.closedAt ? formatDate(complaint.closedAt) : null,
    service: complaint.service?.name || "N/A",
    product: complaint.product ? `${complaint.product.name} (${complaint.product.code})` : "N/A",
    provider: complaint.provider?.name || "N/A",
    submittedBy: complaint.submittedBy?.name || complaint.submittedBy?.email || "Unknown",
    assignedTo: complaint.assignedAgent?.name || complaint.assignedAgent?.email || "Unassigned",
    financialImpact: complaint.financialImpact || 0,
  }));

  // Format based on requested export type
  switch (options.format) {
    case "csv":
      return formatAsCSV(exportData);
    case "json":
      return JSON.stringify(exportData, null, 2);
    case "excel":
      // For Excel, we return a JSON format that can be processed by the excel-generator utility
      return JSON.stringify(exportData);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

function formatAsCSV(data: any[]): string {
  if (data.length === 0) {
    return "";
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(",");
  
  // Create rows
  const rows = data.map(item => {
    return headers.map(header => {
      const value = item[header];
      // Handle values that might contain commas or quotes
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  return [headerRow, ...rows].join('\n');
}