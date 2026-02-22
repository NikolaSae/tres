// actions/complaints/import.ts
"use server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ComplaintImportSchema } from "@/schemas/complaint";
import { LogSeverity, ComplaintStatus } from "@prisma/client";

export type ImportResult = {
  success: boolean;
  importedCount?: number;
  failedCount?: number;
  errors?: string[];
  message?: string;
};

export async function importComplaints(formData: FormData): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user?.id || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    return { success: false, message: "Unauthorized access" };
  }

  try {
    const file = formData.get("file") as File;
    if (!file) return { success: false, message: "No file provided" };

    const csvText = await file.text();
    const rows = csvText.trim().split("\n");

    if (rows.length < 2) {
      return { success: false, message: "CSV file is empty or missing data rows" };
    }

    const headers = rows[0].split(",").map((h) => h.trim());
    const dataRows = rows.slice(1);

    let importedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const row of dataRows) {
      try {
        const values = row.split(",").map((v) => v.trim());
        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index] ?? "";
        });

        const complaintData = ComplaintImportSchema.parse({
          title: rowData.title,
          description: rowData.description,
          priority: parseInt(rowData.priority) || 3,
          serviceId: rowData.serviceId || null,
          providerId: rowData.providerId || null,
          financialImpact: rowData.financialImpact
            ? parseFloat(rowData.financialImpact)
            : null,
        });

        const complaint = await db.complaint.create({
          data: {
            ...complaintData,
            status: ComplaintStatus.NEW,
            submittedById: session.user.id,
            statusHistory: {
              create: {
                newStatus: ComplaintStatus.NEW,
                changedById: session.user.id,
              },
            },
          },
        });

        await db.activityLog.create({
          data: {
            action: "IMPORT_COMPLAINT",
            entityType: "complaint",
            entityId: complaint.id,
            details: `Uvezena pritužba: ${complaint.title}`,
            severity: LogSeverity.INFO,
            userId: session.user.id,
          },
        });

        importedCount++;
      } catch (error: unknown) {
        failedCount++;
        const msg = error instanceof Error ? error.message : "Nepoznata greška";
        errors.push(`Red ${importedCount + failedCount}: ${msg}`);
      }
    }

    revalidatePath("/complaints");
    revalidatePath("/admin/complaints");

    return {
      success: importedCount > 0,
      importedCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined,
      message:
        importedCount > 0
          ? `Uspešno uvezeno ${importedCount} pritužbi${failedCount > 0 ? ` (${failedCount} neuspešnih)` : ""}`
          : "Nijedna pritužba nije uvezena",
    };
  } catch (error: unknown) {
    console.error("Greška pri importu pritužbi:", error);
    return {
      success: false,
      message: `Greška pri importu: ${error instanceof Error ? error.message : "Nepoznata greška"}`,
    };
  }
}