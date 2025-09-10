// actions/reports/get-recent-reports.ts
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function getRecentReports(limit = 20) {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    // Prikupimo poslednjih `limit` generisanih izveštaja
    const reports = await db.generatedReport.findMany({
      orderBy: { generatedAt: "desc" },
      take: limit,
    });

    // Mapiramo tako da frontend dobije uniforman objekat
    return reports.map((r) => ({
      id: r.id,
      organizationName: r.organizationName,
      status: r.status || "success", // ili iz baze
      fileName: r.fileName,
      generatedAt: r.generatedAt,
    }));
  } catch (error) {
    console.error("Failed to fetch recent reports:", error);
    return [];
  }
}
