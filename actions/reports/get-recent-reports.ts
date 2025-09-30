// actions/reports/get-recent-reports.ts
"use server";

import fs from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Tipovi (ostavljam tvojih definicija)
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

// Helper: bazni direktorijum za reports
function getReportsBaseDir(): string {
  // override preko env var (npr. u produkciji)
  if (process.env.REPORTS_DIR && process.env.REPORTS_DIR.trim()) {
    return path.resolve(process.env.REPORTS_DIR);
  }
  // po defaultu tražimo ./reports u repo root-u
  return path.join(process.cwd(), "reports");
}

// ----------------- Generated Humanitarian Reports iz JSON fajlova -----------------
export async function getGeneratedHumanitarianReports(limit = 20) {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const baseRoot = getReportsBaseDir();
    const baseDir = path.join(baseRoot, "global-counters");

    // Ako nema foldera, vrati prazno (bez crash-a)
    try {
      await fs.access(baseDir);
    } catch (err) {
      console.warn("Reports base dir missing:", baseDir);
      return [];
    }

    const years = await fs.readdir(baseDir);
    const allFiles: { filePath: string; mtime: number }[] = [];

    for (const year of years) {
      const yearDir = path.join(baseDir, year);
      // zaštita ako neko yearDir nije folder
      try {
        const months = await fs.readdir(yearDir);
        for (const month of months) {
          const monthDir = path.join(yearDir, month);
          try {
            const files = await fs.readdir(monthDir);
            for (const file of files.filter((f) => f.endsWith(".json"))) {
              const filePath = path.join(monthDir, file);
              try {
                const stats = await fs.stat(filePath);
                allFiles.push({ filePath, mtime: stats.mtime.getTime() });
              } catch (err) {
                console.warn("Skipping file, stat failed:", filePath, err);
              }
            }
          } catch (err) {
            // monthDir missing or not readable -> skip
            console.warn("Skipping month dir:", monthDir, err);
          }
        }
      } catch (err) {
        // yearDir missing or not readable -> skip
        console.warn("Skipping year dir:", yearDir, err);
      }
    }

    // Sortiraj i uzmi latest
    allFiles.sort((a, b) => b.mtime - a.mtime);
    const latestFiles = allFiles.slice(0, limit);

    const reports: any[] = [];
    for (const f of latestFiles) {
      try {
        const content = await fs.readFile(f.filePath, "utf-8");
        const json: CounterJsonReport = JSON.parse(content);
        reports.push({
          id: f.filePath,
          organizationName: "Multiple",
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

// ----------------- Recent Reports iz foldera (parametrizovano) -----------------
// Pozovi sa getRecentReports() -> trenutni mesec; ili getRecentReports(2025, 8)
export async function getRecentReports(year?: number, month?: number, limit = 20) {
  try {
    // koristi prosledjene year/month ili trenutni datum
    const now = new Date();
    const y = year ?? now.getFullYear();
    const m = month ?? now.getMonth() + 1; // month 1-12
    const monthStr = String(m).padStart(2, "0");

    const baseRoot = getReportsBaseDir();
    const reportsDir = path.join(baseRoot, "global-counters", String(y), monthStr);

    // Ako direktorijum ne postoji -> vrati []
    try {
      await fs.access(reportsDir);
    } catch (err) {
      console.warn("Reports directory does not exist:", reportsDir);
      return [];
    }

    const files = await fs.readdir(reportsDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const reports = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(reportsDir, file);
        const stats = await fs.stat(filePath);

        // Čitanje JSON sadržaja (bez pucanja na invalid JSON)
        let jsonData: any = {};
        try {
          const jsonDataRaw = await fs.readFile(filePath, "utf-8");
          jsonData = JSON.parse(jsonDataRaw);
        } catch (err) {
          console.warn("Invalid JSON or read error for file:", filePath, err);
        }

        return {
          id: file,
          fileName: file,
          filePath: `/reports/global-counters/${y}/${monthStr}/${file}`,
          uploadedAt: stats.birthtime,
          fileSize: stats.size,
          organizationName: "Imported JSON",
          status: "success",
          data: jsonData,
        };
      })
    );

    // Sortiranje po upload time i trim
    reports.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    return reports.slice(0, limit);
  } catch (err) {
    console.error("Failed to fetch JSON reports:", err);
    return [];
  }
}
