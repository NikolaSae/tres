// /actions/complaints/import.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ComplaintImportSchema } from "@/schemas/complaint"; // ✅ Ispravka: ComplaintImportSchema postoji
import { LogSeverity, ComplaintStatus } from "@prisma/client";

export type ImportResult = {
  success: boolean;
  importedCount?: number;
  failedCount?: number;
  errors?: string[];
  message?: string;
};

// ✅ Potrebno je kreirati ComplaintImportSchema u schemas/complaint.ts
// ili koristiti postojeću ComplaintSchema

export async function importComplaints(formData: FormData): Promise<ImportResult> {
  const session = await auth();
  
  if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    return {
      success: false,
      message: "Unauthorized access"
    };
  }

  try {
    // Get the file from FormData
    const file = formData.get("file") as File;
    if (!file) {
      return {
        success: false,
        message: "No file provided"
      };
    }

    // Read the file content
    const csvText = await file.text();
    
    // Parse CSV data
    const rows = csvText.trim().split("\n");
    if (rows.length < 2) {
      return {
        success: false,
        message: "CSV file is empty or missing data rows"
      };
    }

    const headers = rows[0].split(",").map(h => h.trim());
    const dataRows = rows.slice(1);
    
    let importedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const row of dataRows) {
      try {
        const values = row.split(",").map(v => v.trim());
        const rowData: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          rowData[header] = values[index];
        });

        // Validate and parse data - koristiti ComplaintSchema ili kreirati specifičnu za import
        const complaintData = ComplaintSchema.parse({
          title: rowData.title,
          description: rowData.description,
          priority: parseInt(rowData.priority) || 3,
          serviceId: rowData.serviceId || null,
          productId: rowData.productId || null,
          providerId: rowData.providerId || null,
          financialImpact: rowData.financialImpact ? parseFloat(rowData.financialImpact) : null,
        });

        // Create the complaint
        const complaint = await db.complaint.create({
          data: {
            ...complaintData,
            status: ComplaintStatus.NEW,
            submittedById: session.user.id,
            // Create initial status history
            statusHistory: {
              create: {
                newStatus: ComplaintStatus.NEW,
                changedById: session.user.id,
              },
            },
          },
        });

        // Log activity
        await db.activityLog.create({
          data: {
            action: "IMPORT_COMPLAINT",
            entityType: "complaint",
            entityId: complaint.id,
            details: `Imported complaint: ${complaint.title}`,
            severity: LogSeverity.INFO,
            userId: session.user.id,
          },
        });

        importedCount++;
      } catch (error) {
        failedCount++;
        errors.push(`Row ${importedCount + failedCount}: ${error.message || "Unknown error"}`);
      }
    }

    revalidatePath("/complaints");
    revalidatePath("/admin/complaints");

    return {
      success: importedCount > 0,
      importedCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: importedCount > 0 
        ? `Successfully imported ${importedCount} complaints${failedCount > 0 ? ` (${failedCount} failed)` : ''}`
        : "No complaints were imported"
    };
  } catch (error) {
    console.error("Import process failed:", error);
    return {
      success: false,
      message: `Import process failed: ${error.message || "Unknown error"}`
    };
  }
}