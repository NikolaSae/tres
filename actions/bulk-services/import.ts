// actions/bulk-services/import.ts
"use server";

import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { getCurrentUser } from "@/lib/session";
import { parseBulkServiceCSV, processBulkServiceCsv } from "@/lib/bulk-services/csv-processor";
import { ActivityLogService } from "@/lib/services/activity-log-service";
import { LogSeverity, ServiceType, BillingType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { BulkServiceImportResult } from "@/lib/types/bulk-service-types";

export async function importBulkServicesFromCsv(
  csvContent: string,
  importDate: Date
): Promise<BulkServiceImportResult> {
  const results: BulkServiceImportResult = {
    totalRows: 0,
    validRows: [],
    invalidRows: [],
    importErrors: [],
    error: null,
    createdCount: 0,
    updatedCount: 0,
    createdServices: [],
  };

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      results.error = "Unauthorized";
      results.importErrors.push("Unauthorized");
      return results;
    }

    const { data: parsedCsvData, errors: initialParseErrors } = await parseBulkServiceCSV(csvContent);

    // Store only error messages, not the error objects
    initialParseErrors.forEach(e => {
      results.importErrors.push(`Row ${e.rowIndex === -1 ? 'N/A' : e.rowIndex + 2}: ${e.errors.join('; ')}`);
    });

    results.totalRows = parsedCsvData.length;

    const [existingProviders, existingServices] = await Promise.all([
      db.provider.findMany({ select: { id: true, name: true } }),
      db.service.findMany({ select: { id: true, name: true } }),
    ]);

    const providerMap = new Map(existingProviders.map(p => [p.name.toLowerCase(), p.id]));
    let serviceMap = new Map(existingServices.map(s => [s.name.toLowerCase(), s.id]));

    // Auto-create missing services
    const uniqueCompositeServices = new Map<string, {
      originalProviderName: string;
      originalAgreementName: string;
      originalServiceName: string;
      originalStepName: string;
      originalSenderName: string;
      compositeNamePreserveCase: string;
    }>();

    parsedCsvData.forEach(row => {
      if (row.provider_name && row.agreement_name && row.service_name && row.step_name && row.sender_name) {
        const composite = `${row.provider_name}-${row.agreement_name}-${row.service_name}-${row.step_name}-${row.sender_name}`;
        const compositeLower = composite.toLowerCase();

        if (!uniqueCompositeServices.has(compositeLower)) {
          uniqueCompositeServices.set(compositeLower, {
            originalProviderName: row.provider_name,
            originalAgreementName: row.agreement_name,
            originalServiceName: row.service_name,
            originalStepName: row.step_name,
            originalSenderName: row.sender_name,
            compositeNamePreserveCase: composite
          });
        }
      }
    });

    const newlyCreatedServices: { id: string; name: string }[] = [];

    for (const [compositeLower, details] of uniqueCompositeServices) {
      if (!serviceMap.has(compositeLower)) {
        try {
          const newService = await db.service.create({
            data: {
              name: details.compositeNamePreserveCase,
              type: ServiceType.BULK,
              billingType: BillingType.POSTPAID,
              description: `Auto-created from bulk import: ${details.compositeNamePreserveCase}`,
              isActive: true,
            },
          });

          newlyCreatedServices.push({ id: newService.id, name: newService.name });
          serviceMap.set(compositeLower, newService.id);
        } catch (err: any) {
          if (err.code === 'P2002') {
            // Race condition – service created in meantime
            const existing = await db.service.findFirst({
              where: { name: { equals: details.compositeNamePreserveCase, mode: 'insensitive' } },
            });
            if (existing) serviceMap.set(existing.name.toLowerCase(), existing.id);
          } else {
            results.importErrors.push(`Failed to create service "${details.compositeNamePreserveCase}": ${err.message}`);
          }
        }
      }
    }

    results.createdServices = newlyCreatedServices;

    const processingResult = processBulkServiceCsv(parsedCsvData, providerMap, serviceMap);

    results.validRows = processingResult.validRows;
    
    // Only add CsvRowValidationResult items to invalidRows
    results.invalidRows = processingResult.invalidRows;
    
    // Add error messages separately
    results.importErrors.push(...processingResult.importErrors);

    if (results.importErrors.length > 0 || results.validRows.length === 0) {
      results.error = "Import completed with errors or no valid rows.";
      return results;
    }

    // Check for existing records by composite key + datumNaplate
    const existingRecords = await db.bulkService.findMany({
      where: { datumNaplate: importDate },
      select: {
        provider_name: true,
        agreement_name: true,
        service_name: true,
        step_name: true,
        sender_name: true,
        datumNaplate: true,
      },
    });

    const existingKeys = new Set(
      existingRecords.map(r =>
        `${r.provider_name}-${r.agreement_name}-${r.service_name}-${r.step_name}-${r.sender_name}-${r.datumNaplate?.toISOString()}`
      )
    );

    const recordsToCreate = results.validRows.filter(r => {
      const key = `${r.provider_name}-${r.agreement_name}-${r.service_name}-${r.step_name}-${r.sender_name}-${importDate.toISOString()}`;
      return !existingKeys.has(key);
    });

    const recordsToUpdate = results.validRows.filter(r => {
      const key = `${r.provider_name}-${r.agreement_name}-${r.service_name}-${r.step_name}-${r.sender_name}-${importDate.toISOString()}`;
      return existingKeys.has(key);
    });

    // Create new
    const created = await db.$transaction(
      recordsToCreate.map(r =>
        db.bulkService.create({
          data: {
            providerId: r.providerId!,
            serviceId: r.serviceId!,
            provider_name: r.provider_name,
            agreement_name: r.agreement_name,
            service_name: r.service_name,
            step_name: r.step_name,
            sender_name: r.sender_name,
            requests: r.requests,
            message_parts: r.message_parts,
            datumNaplate: importDate,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      )
    );

    // Update existing (updateMany vraća broj ažuriranih)
    let updatedCount = 0;
    for (const r of recordsToUpdate) {
      const count = await db.bulkService.updateMany({
        where: {
          provider_name: r.provider_name,
          agreement_name: r.agreement_name,
          service_name: r.service_name,
          step_name: r.step_name,
          sender_name: r.sender_name,
          datumNaplate: importDate,
        },
        data: {
          providerId: r.providerId!,
          serviceId: r.serviceId!,
          requests: r.requests,
          message_parts: r.message_parts,
          updatedAt: new Date(),
        },
      });
      updatedCount += count.count;
    }

    results.createdCount = created.length;
    results.updatedCount = updatedCount;

    await ActivityLogService.log({
      action: "IMPORT_BULK_SERVICES",
      entityType: "BULK_SERVICE",
      entityId: null,
      details: `Uvezeno ${results.createdCount} novih, ažurirano ${results.updatedCount} postojećih bulk servisa. Kreirano ${results.createdServices.length} novih servisa.`,
      severity: LogSeverity.INFO,
      userId: currentUser.id,
    });

    revalidatePath("/bulk-services");
    revalidatePath("/services");

    return results;
  } catch (error) {
    console.error("[IMPORT_BULK_SERVICES]", error);
    results.error = error instanceof Error ? error.message : "Nepoznata greška pri importu";
    results.importErrors.push(results.error);
    return results;
  }
}
