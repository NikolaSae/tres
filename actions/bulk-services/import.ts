// actions/bulk-services/import.ts
"use server";
import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { getCurrentUser } from "@/lib/session";
import { parseBulkServiceCSV, processBulkServiceCsv } from "@/lib/bulk-services/csv-processor";
import { ActivityLogService } from "@/lib/services/activity-log-service";
import { LogSeverity, ServiceType, BillingType } from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
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

    initialParseErrors.forEach(e => {
      results.importErrors.push(`Row ${e.rowIndex === -1 ? 'N/A' : e.rowIndex + 2}: ${e.errors.join('; ')}`);
    });

    results.totalRows = parsedCsvData.length;

    const [existingProviders, existingServices] = await Promise.all([
      db.provider.findMany({
        select: { id: true, name: true },
        where: { isActive: true },
      }),
      db.service.findMany({
        select: { id: true, name: true },
        where: { type: ServiceType.BULK },
      }),
    ]);

    const providerMap = new Map(existingProviders.map(p => [p.name.toLowerCase(), p.id]));
    let serviceMap = new Map(existingServices.map(s => [s.name.toLowerCase(), s.id]));

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
            compositeNamePreserveCase: composite,
          });
        }
      }
    });

    const newlyCreatedServices: { id: string; name: string }[] = [];

    const servicesToCreate = Array.from(uniqueCompositeServices.entries())
      .filter(([compositeLower]) => !serviceMap.has(compositeLower));

    if (servicesToCreate.length > 0) {
      try {
        const createdServices = await db.$transaction(
          servicesToCreate.map(([, details]) =>
            db.service.create({
              data: {
                name: details.compositeNamePreserveCase,
                type: ServiceType.BULK,
                billingType: BillingType.POSTPAID,
                description: `Auto-created from bulk import: ${details.compositeNamePreserveCase}`,
                isActive: true,
              },
            })
          )
        );

        createdServices.forEach(service => {
          newlyCreatedServices.push({ id: service.id, name: service.name });
          serviceMap.set(service.name.toLowerCase(), service.id);
        });
      } catch (_err: unknown) {
        // Race condition — neki servis je kreiran između našeg čitanja i pisanja
        const existingAfterRace = await db.service.findMany({
          where: {
            type: ServiceType.BULK,
            name: { in: servicesToCreate.map(([, d]) => d.compositeNamePreserveCase) },
          },
          select: { id: true, name: true },
        });

        existingAfterRace.forEach(service => {
          serviceMap.set(service.name.toLowerCase(), service.id);
        });
      }
    }

    results.createdServices = newlyCreatedServices;

    const processingResult = processBulkServiceCsv(parsedCsvData, providerMap, serviceMap);

    results.validRows = processingResult.validRows;
    results.invalidRows = processingResult.invalidRows;
    results.importErrors.push(...processingResult.importErrors);

    if (results.importErrors.length > 0 || results.validRows.length === 0) {
      results.error = "Import completed with errors or no valid rows.";
      return results;
    }

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

    let updatedCount = 0;

    if (recordsToUpdate.length > 0) {
      const updateResults = await db.$transaction(
        recordsToUpdate.map(r =>
          db.bulkService.updateMany({
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
          })
        )
      );

      updatedCount = updateResults.reduce((sum, result) => sum + result.count, 0);
    }

    results.createdCount = created.length;
    results.updatedCount = updatedCount;

    await ActivityLogService.log({
      action: "IMPORT_BULK_SERVICES",
      entityType: "BULK_SERVICE",
      entityId: null,
      details: `Uvezeno ${results.createdCount} novih, ažurirano ${results.updatedCount} postojećih bulk servisa. Kreirano ${results.createdServices.length} novih servisa.`,
      severity: LogSeverity.INFO,
      userId: currentUser.id!,
    });

    // Invalidate sve pogođene tagove
    updateTag("bulk-services");
    updateTag("services");
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