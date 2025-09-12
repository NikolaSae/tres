// actions/reports/get-recent-reports.ts
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseReportPath } from "@/utils/report-path";
// Dodajemo novu akciju specifično za generisane humanitarian izveštaje
export async function getGeneratedHumanitarianReports(limit = 20) {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const reports = await db.generatedReport.findMany({
      where: {
        reportType: "humanitarian"
      },
      orderBy: { generatedAt: "desc" },
      take: limit,
    });

    return reports.map((r) => {
      // Parsiraj putanju kako bismo dobili detalje
      const pathInfo = parseReportPath(r.fileUrl);
      
      return {
        id: r.id,
        organizationName: r.name || "Unknown Organization",
        status: "success",
        fileName: r.fileUrl ? r.fileUrl.split('/').pop() || `report_${r.id}.xlsx` : `report_${r.id}.xlsx`,
        filePath: r.fileUrl || `/reports/generated/report_${r.id}.xlsx`,
        fileSize: 0,
        generatedAt: r.generatedAt,
        reportType: r.reportType || "humanitarian",
        month: pathInfo?.month || r.generatedAt.getMonth() + 1,
        year: pathInfo?.year || r.generatedAt.getFullYear()
      };
    });
  } catch (error) {
    console.error("Failed to fetch generated humanitarian reports:", error);
    return [];
  }
}

// Postojeća akcija ostaje za Recent Reports tab (file uploads)
export async function getRecentReports(limit = 20) {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    // Ova akcija sada vraća file uploads, ne generisane izveštaje
    const reports = await db.reportFile.findMany({
      include: {
        organization: {
          select: {
            name: true
          }
        }
      },
      orderBy: { uploadedAt: "desc" },
      take: limit,
    });

    return reports;
  } catch (error) {
    console.error("Failed to fetch recent reports:", error);
    return [];
  }
}