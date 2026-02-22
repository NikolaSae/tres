// /actions/complaints/export.ts
"use server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { formatDate } from "@/utils/date-filters";

export type ExportFormat = "csv" | "json" | "excel";

export type ExportRequestOptions = {
  type?: "all" | "filtered";
  dateRange?: number | { from: Date; to: Date };
  includeComments?: boolean;
  includeStatusHistory?: boolean;
  includeAttachments?: boolean;
  format?: ExportFormat;
};

export type ExportResult = {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  error?: string;
};

// ✅ Tip za export red
type ExportRow = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: number;
  financialImpact: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  service: string;
  product: string;
  provider: string;
  submittedBy: string;
  assignedTo: string;
  humanitarianOrg: string;
  parkingService: string;
};

export async function exportComplaints(options: ExportRequestOptions): Promise<ExportResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized access" };
    }

    // ✅ FIX: Prisma.ComplaintWhereInput umesto any
    const where: Prisma.ComplaintWhereInput = {};

    if (options.dateRange) {
      if (typeof options.dateRange === "number") {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - options.dateRange);
        where.createdAt = { gte: daysAgo, lte: new Date() };
      } else {
        where.createdAt = {
          gte: options.dateRange.from,
          lte: options.dateRange.to,
        };
      }
    }

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
        ...(options.includeComments && {
          comments: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        }),
        ...(options.includeAttachments && { attachments: true }),
        ...(options.includeStatusHistory && { statusHistory: true }),
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    const exportData: ExportRow[] = complaints.map((complaint) => ({
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
      product: complaint.product
        ? `${complaint.product.name} (${complaint.product.code})`
        : "N/A",
      provider: complaint.provider?.name || "N/A",
      submittedBy:
        complaint.submittedBy?.name || complaint.submittedBy?.email || "Unknown",
      assignedTo:
        complaint.assignedAgent?.name ||
        complaint.assignedAgent?.email ||
        "Unassigned",
      humanitarianOrg: complaint.humanitarianOrg?.name || "N/A",
      parkingService: complaint.parkingService?.name || "N/A",
    }));

    const format = options.format || "excel";
    let content: string;
    let fileName: string;
    let mimeType: string;

    switch (format) {
      case "csv":
        content = formatAsCSV(exportData);
        fileName = `complaints-export-${Date.now()}.csv`;
        mimeType = "text/csv";
        break;
      case "json":
        content = JSON.stringify(exportData, null, 2);
        fileName = `complaints-export-${Date.now()}.json`;
        mimeType = "application/json";
        break;
      case "excel":
      default:
        content = formatAsCSV(exportData);
        fileName = `complaints-export-${Date.now()}.csv`;
        mimeType = "text/csv";
        break;
    }

    const dataUrl = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;

    return { success: true, fileUrl: dataUrl, fileName };
  } catch (error) {
    console.error("[EXPORT_ERROR]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export complaints",
    };
  }
}

// ✅ FIX: ExportRow[] umesto any[]
function formatAsCSV(data: ExportRow[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]) as (keyof ExportRow)[];
  const headerRow = headers.join(",");

  const rows = data.map((item) =>
    headers
      .map((header) => {
        const value = item[header];
        if (value === null || value === undefined) return "";
        const str = String(value);
        if (str.includes('"') || str.includes(",") || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(",")
  );

  return [headerRow, ...rows].join("\n");
}