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
  priority?: number;              // 1-5
  search?: string;                // pretraga po title/description
  serviceId?: string;
  providerId?: string;
  productId?: string;
  submittedById?: string;         // ko je podneo žalbu
  assignedAgentId?: string;       // kome je dodeljena
  humanitarianOrgId?: string;     // ako je povezano sa humanitarnom org.
  parkingServiceId?: string;      // ako je povezano sa parking servisom
  orderBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'title';  // dodaj polja po potrebi
  orderDirection?: 'asc' | 'desc';
  limit?: number;                 // max broj rezultata (default 1000)
};

export async function exportComplaints(options: ExportOptions): Promise<string> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized access");
  }

  // Build filter criteria
  const where: any = {};

  // Date range
  if (options.dateRange) {
    where.createdAt = {
      gte: options.dateRange.from,
      lte: options.dateRange.to,
    };
  }

  // Statuses
  if (options.statuses && options.statuses.length > 0) {
    where.status = { in: options.statuses };
  }

  // Priority
  if (options.priority !== undefined) {
    where.priority = options.priority;
  }

  // Search (title i description)
  if (options.search) {
    where.OR = [
      { title: { contains: options.search, mode: 'insensitive' } },
      { description: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  // Veze sa entitetima
  if (options.serviceId) where.serviceId = options.serviceId;
  if (options.providerId) where.providerId = options.providerId;
  if (options.productId) where.productId = options.productId;
  if (options.submittedById) where.submittedById = options.submittedById;
  if (options.assignedAgentId) where.assignedAgentId = options.assignedAgentId;
  if (options.humanitarianOrgId) where.humanitarianOrgId = options.humanitarianOrgId;
  if (options.parkingServiceId) where.parkingServiceId = options.parkingServiceId;

  // Sortiranje
  const orderBy = options.orderBy || 'createdAt';
  const orderDirection = options.orderDirection || 'desc';

  // Fetch complaints with relations
  const complaints = await db.complaint.findMany({
    where,
    include: {
      service: { select: { name: true } },
      product: { select: { name: true, code: true } },
      provider: { select: { name: true } },
      submittedBy: { select: { name: true, email: true } },
      assignedAgent: { select: { name: true, email: true } },
      humanitarianOrg: { select: { name: true } },
      parkingService: { select: { name: true } },
    },
    orderBy: { [orderBy]: orderDirection },
    take: options.limit || 1000,  // max 1000 da ne preoptereti
  });

  // Transform data for export
  const exportData = complaints.map((complaint) => ({
    id: complaint.id,
    title: complaint.title,
    description: complaint.description,
    status: complaint.status,
    priority: complaint.priority,
    financialImpact: complaint.financialImpact || 0,
    createdAt: formatDate(complaint.createdAt),
    updatedAt: formatDate(complaint.updatedAt),
    resolvedAt: complaint.resolvedAt ? formatDate(complaint.resolvedAt) : null,
    closedAt: complaint.closedAt ? formatDate(complaint.closedAt) : null,
    service: complaint.service?.name || "N/A",
    product: complaint.product ? `${complaint.product.name} (${complaint.product.code})` : "N/A",
    provider: complaint.provider?.name || "N/A",
    submittedBy: complaint.submittedBy?.name || complaint.submittedBy?.email || "Unknown",
    assignedTo: complaint.assignedAgent?.name || complaint.assignedAgent?.email || "Unassigned",
    humanitarianOrg: complaint.humanitarianOrg?.name || "N/A",
    parkingService: complaint.parkingService?.name || "N/A",
  }));

  // Format based on requested export type
  switch (options.format) {
    case "csv":
      return formatAsCSV(exportData);
    case "json":
      return JSON.stringify(exportData, null, 2);
    case "excel":
      return JSON.stringify(exportData); // možeš dodati excel biblioteku kasnije
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