// actions/reports/get-recent-reports.ts
"use server";

import fs from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
// Interface za parsiranje JSON fajla
interface ProcessedOrganization {
  name: string;
  timestamp: string;
  value: number;
  counterAssigned: number;
}

interface CounterJsonReport {
  totalReports: number;
  validReportsCount: number;
  createdAt: string;
  lastUpdated: string;
  month: number;
  year: number;
  generationType: string;
  processedOrganizations: ProcessedOrganization[];
}

// ----------------- Generated Humanitarian Reports iz JSON fajlova -----------------
export async function getGeneratedHumanitarianReports(limit = 20) {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const baseDir = path.join(process.cwd(), "reports/global-counters");
    const years = await fs.readdir(baseDir);
    const allFiles: { filePath: string; mtime: number }[] = [];

    for (const year of years) {
      const yearDir = path.join(baseDir, year);
      const months = await fs.readdir(yearDir);
      for (const month of months) {
        const monthDir = path.join(yearDir, month);
        const files = await fs.readdir(monthDir);
        for (const file of files.filter(f => f.endsWith(".json"))) {
          const filePath = path.join(monthDir, file);
          const stats = await fs.stat(filePath);
          allFiles.push({ filePath, mtime: stats.mtime.getTime() });
        }
      }
    }

    // Sortiraj po vremenu kreiranja (najnoviji prvi)
    allFiles.sort((a, b) => b.mtime - a.mtime);

    const latestFiles = allFiles.slice(0, limit);

    const reports: any[] = [];

    for (const f of latestFiles) {
      try {
        const content = await fs.readFile(f.filePath, "utf-8");
        const json: CounterJsonReport = JSON.parse(content);

        // Napravi report object kompatibilan sa frontendom
        reports.push({
          id: f.filePath,
          organizationName: "Multiple", // možeš staviti ovo ili neki summary
          status: "success",
          fileName: path.basename(f.filePath),
          filePath: `/reports/global-counters/${json.year}/${String(json.month).padStart(2, "0")}/${path.basename(f.filePath)}`,
          fileSize: 0,
          generatedAt: new Date(json.createdAt),
          reportType: "humanitarian",
          month: json.month,
          year: json.year,
        });
      } catch (err) {
        console.error("Failed to parse JSON file:", f.filePath, err);
      }
    }

    return reports;
  } catch (error) {
    console.error("Failed to fetch generated humanitarian reports:", error);
    return [];
  }
}

// ----------------- Recent Reports iz baze (file uploads) -----------------
export async function getRecentReports(limit = 20) {
  try {
    const reportsDir = path.join(
      "C:/xampp/htdocs/fin-app-hub/reports/global-counters/2025/08"
    );

    const files = await fs.readdir(reportsDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const reports = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(reportsDir, file);
        const stats = await fs.stat(filePath);

        // Čitanje JSON sadržaja
        const jsonDataRaw = await fs.readFile(filePath, "utf-8");
        let jsonData: any = {};
        try {
          jsonData = JSON.parse(jsonDataRaw);
        } catch (err) {
          console.error("Invalid JSON:", file, err);
        }

        return {
          id: file,
          fileName: file,
          filePath: `/reports/global-counters/2025/08/${file}`,
          uploadedAt: stats.birthtime,
          fileSize: stats.size,
          organizationName: "Imported JSON",
          status: "success",
          data: jsonData, // <-- dodajemo sadržaj JSON-a ovde
        };
      })
    );

    // Sortiranje i limit
    reports.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    return reports.slice(0, limit);
  } catch (err) {
    console.error("Failed to fetch JSON reports:", err);
    return [];
  }
}
