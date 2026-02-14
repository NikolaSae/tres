// /actions/complaints/export.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ComplaintStatus } from "@prisma/client";
import { formatDate } from "@/utils/date-filters";

export type ExportFormat = "csv" | "json" | "excel";

export type ExportRequestOptions = {
  type?: 'all' | 'filtered';
  dateRange?: number;
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

export async function exportComplaints(options: ExportRequestOptions): Promise<ExportResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized access"
      };
    }

    const where: any = {};

    if (options.dateRange) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - options.dateRange);
      where.createdAt = {
        gte: daysAgo,
        lte: new Date(),
      };
    }

    // ✅ FIX: Build proper include object with explicit structure
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
        // ✅ Conditionally include these using spread
        ...(options.includeComments && {
          comments: {
            include: {
              user: { select: { id: true, name: true, email: true } }
            }
          }
        }),
        ...(options.includeAttachments && {
          attachments: true
        }),
        ...(options.includeStatusHistory && {
          statusHistory: true
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

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

    const format = options.format || 'excel';
    let content: string;
    let fileName: string;
    let mimeType: string;

    switch (format) {
      case "csv":
        content = formatAsCSV(exportData);
        fileName = `complaints-export-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;
      case "json":
        content = JSON.stringify(exportData, null, 2);
        fileName = `complaints-export-${Date.now()}.json`;
        mimeType = 'application/json';
        break;
      case "excel":
      default:
        content = formatAsCSV(exportData);
        fileName = `complaints-export-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;
    }

    const dataUrl = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;

    return {
      success: true,
      fileUrl: dataUrl,
      fileName: fileName,
    };
  } catch (error) {
    console.error("[EXPORT_ERROR]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export complaints"
    };
  }
}

function formatAsCSV(data: any[]): string {
  if (data.length === 0) {
    return "";
  }

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(",");
  
  const rows = data.map(item => {
    return headers.map(header => {
      const value = item[header];
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