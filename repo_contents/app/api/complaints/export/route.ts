// /app/api/complaints/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check if user has permission to export data
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!["ADMIN", "MANAGER"].includes(user?.role || "")) {
      return new NextResponse("Not authorized to export data", { status: 403 });
    }

    const searchParams = new URL(req.url).searchParams;
    const format = searchParams.get("format") || "xlsx";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const serviceId = searchParams.get("serviceId");
    const providerId = searchParams.get("providerId");
    const productId = searchParams.get("productId");
    
    // Build filter conditions
    let whereClause: any = {};
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (serviceId) {
      whereClause.serviceId = serviceId;
    }
    
    if (providerId) {
      whereClause.providerId = providerId;
    }
    
    if (productId) {
      whereClause.productId = productId;
    }

    // Fetch complaints with related data
    const complaints = await db.complaint.findMany({
      where: whereClause,
      include: {
        service: {
          select: {
            name: true,
          },
        },
        product: {
          select: {
            name: true,
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

    // Log the export activity
    await db.activityLog.create({
      data: {
        action: "EXPORT_COMPLAINTS",
        entityType: "complaint",
        details: `Exported ${complaints.length} complaints in ${format} format`,
        userId: session.user.id,
      },
    });

    // Transform data for export
    const exportData = complaints.map(complaint => ({
      ID: complaint.id,
      Title: complaint.title,
      Description: complaint.description,
      Status: complaint.status,
      Priority: complaint.priority,
      Service: complaint.service?.name || "N/A",
      Product: complaint.product?.name || "N/A",
      Provider: complaint.provider?.name || "N/A",
      "Financial Impact": complaint.financialImpact || 0,
      "Submitted By": complaint.submittedBy?.name || "Unknown",
      "Submitter Email": complaint.submittedBy?.email || "N/A",
      "Assigned Agent": complaint.assignedAgent?.name || "Unassigned",
      "Agent Email": complaint.assignedAgent?.email || "N/A",
      "Created At": complaint.createdAt.toISOString(),
      "Updated At": complaint.updatedAt.toISOString(),
      "Assigned At": complaint.assignedAt?.toISOString() || "N/A",
      "Resolved At": complaint.resolvedAt?.toISOString() || "N/A",
      "Closed At": complaint.closedAt?.toISOString() || "N/A",
    }));

    if (format === "json") {
      return NextResponse.json(exportData);
    } else if (format === "csv") {
      // Convert to CSV
      const headers = Object.keys(exportData[0] || {}).join(",") + "\n";
      const csv = exportData.reduce((str, row) => {
        return str + Object.values(row).map(value => 
          typeof value === "string" && value.includes(",") 
            ? `"${value}"`
            : value
        ).join(",") + "\n";
      }, headers);
      
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="complaints_export_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    } else {
      // Default to XLSX format
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Complaints");
      
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="complaints_export_${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      });
    }
  } catch (error) {
    console.error("[EXPORT_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}