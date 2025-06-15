//actions/bulk-services/import.ts

"use server";

import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { getCurrentUser } from "@/lib/session";
import { parseBulkServiceCSV, processBulkServiceCsv } from "@/lib/bulk-services/csv-processor";
import { ActivityLogService } from "@/lib/services/activity-log-service";
import { LogSeverity, ServiceType, BillingType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { BulkServiceImportResult } from "@/lib/types/bulk-service-types";

export async function importBulkServicesFromCsv(csvContent: string): Promise<BulkServiceImportResult> {
  const results: BulkServiceImportResult = {
    totalRows: 0,
    validRows: [],
    invalidRows: [],
    importErrors: [],
    error: null,
    createdCount: 0,
    createdServices: [],
  };

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      results.error = "Unauthorized";
      results.importErrors.push("Unauthorized");
      return results;
    }

    const { data: parsedCsvData, errors: initialParseErrors } = await parseBulkServiceCSV(csvContent);
    
    initialParseErrors.forEach(e => {
        results.importErrors.push(`Row ${e.rowIndex === -1 ? 'N/A' : e.rowIndex + 2}: ${e.errors.join('; ')}`);
        results.invalidRows.push(e);
    });
    results.totalRows = parsedCsvData.length;

    const [existingProviders, existingServices] = await Promise.all([
      db.provider.findMany({ select: { id: true, name: true } }),
      db.service.findMany({ select: { id: true, name: true } }),
    ]);

    // Convert provider names to lowercase for case-insensitive comparison
    const providerMap = new Map(existingProviders.map(p => [p.name.toLowerCase(), p.id]));
    
    // Convert service names to lowercase for case-insensitive comparison
    let serviceMap = new Map(existingServices.map(s => [s.name.toLowerCase(), s.id]));

    // Logic for auto-creating SERVICES with the correct composite name
    // Track generated composite names for logging
    const compositeNameMapping = new Map<string, string>();
    
    // Step 1: First pass - generate all composite service names
    const uniqueCompositeServices = new Map<string, {
      originalProviderName: string;
      originalAgreementName: string;
      originalServiceName: string;
      originalStepName: string;
      originalSenderName: string;
      compositeNamePreserveCase: string;
    }>();
    
    // First pass to identify all unique composite services
    parsedCsvData.forEach(row => {
      if (row.provider_name && row.agreement_name && row.service_name && row.step_name && row.sender_name) {
        // Preserve the original case for service creation
        const compositeNamePreserveCase = `${row.provider_name}-${row.agreement_name}-${row.service_name}-${row.step_name}-${row.sender_name}`;
        // Use lowercase for lookups
        const compositeNameLowercase = compositeNamePreserveCase.toLowerCase();
        
        // Store mapping for reference and debugging
        compositeNameMapping.set(compositeNameLowercase, compositeNamePreserveCase);
        
        if (!uniqueCompositeServices.has(compositeNameLowercase)) {
          uniqueCompositeServices.set(compositeNameLowercase, {
            originalProviderName: row.provider_name,
            originalAgreementName: row.agreement_name,
            originalServiceName: row.service_name,
            originalStepName: row.step_name,
            originalSenderName: row.sender_name,
            compositeNamePreserveCase
          });
        }
      }
    });

    // Step 2: Create services that don't exist
    const newlyCreatedServicesList: { id: string; name: string }[] = [];
    
    // For each unique composite service
    for (const [compositeNameLowercase, serviceDetails] of uniqueCompositeServices.entries()) {
      const { compositeNamePreserveCase } = serviceDetails;
      
      // Check if this service already exists (case insensitive)
      if (!serviceMap.has(compositeNameLowercase)) {
        try {
          console.log(`Creating service: "${compositeNamePreserveCase}"`);
          
          // Create with original case preserved
          const newService = await db.service.create({
            data: {
              name: compositeNamePreserveCase,
              type: ServiceType.BULK,
              billingType: BillingType.POSTPAID,
              description: `Auto-created service for bulk import: ${compositeNamePreserveCase}`,
              isActive: true,
            },
          });
          
          // Add to our newly created services list for tracking
          newlyCreatedServicesList.push({ id: newService.id, name: newService.name });
          
          // Update our service map (lowercase for lookups)
          serviceMap.set(compositeNamePreserveCase.toLowerCase(), newService.id);
          
        } catch (serviceCreateError: any) {
          // Handle unique constraint violation
          if (serviceCreateError.code === 'P2002') {
            console.log(`Service exists but couldn't be mapped: "${compositeNamePreserveCase}"`);
            
            // Try to retrieve the existing service
            const existingService = await db.service.findFirst({ 
              where: { 
                name: { 
                  equals: compositeNamePreserveCase,
                  mode: 'insensitive'  // Case insensitive search
                } 
              } 
            });
            
            if (existingService) {
              serviceMap.set(existingService.name.toLowerCase(), existingService.id);
            } else {
              results.importErrors.push(`Failed to auto-create service "${compositeNamePreserveCase}": It might exist but couldn't be retrieved.`);
            }
          } else {
            results.importErrors.push(`Failed to auto-create service "${compositeNamePreserveCase}": ${serviceCreateError.message || 'Unknown error'}`);
          }
        }
      }
    }
    
    results.createdServices = newlyCreatedServicesList;

    // Ensure the CSV processor uses the same lowercase mapping approach
    const processingResult = processBulkServiceCsv(parsedCsvData, providerMap, serviceMap);

    results.validRows = processingResult.validRows;
    results.invalidRows.push(...processingResult.invalidRows);
    results.importErrors.push(...processingResult.importErrors);

    // If there are still errors, log more details to help debugging
    if (results.importErrors.length > 0) {
      console.log("All service keys in serviceMap:", Array.from(serviceMap.keys()));
      console.log("Service creation mappings:", Array.from(compositeNameMapping.entries()).slice(0, 10));
      console.log("Provider map keys:", Array.from(providerMap.keys()).slice(0, 10));
      
      // Log the first few invalid rows for debugging
      processingResult.invalidRows.slice(0, 5).forEach((row, idx) => {
        console.log(`Invalid row ${idx}:`, row);
      });
      
      results.error = "Failed to process bulk service CSV file due to parsing or initial errors.";
      return results;
    }

    if (results.validRows.length === 0) {
      results.error = results.invalidRows.length > 0
        ? "No valid records found for import after validation and mapping. Ensure all providers exist and services are correctly mapped."
        : "CSV file is empty or contains no valid data.";
      return results;
    }

    const createdRecords = await db.$transaction(
      processingResult.validRows.map(record =>
        db.bulkService.create({
          data: {
            providerId: record.providerId as string,
            serviceId: record.serviceId as string,
            provider_name: record.provider_name,
            agreement_name: record.agreement_name,
            service_name: record.service_name,
            step_name: record.step_name,
            sender_name: record.sender_name,
            requests: record.requests,
            message_parts: record.message_parts,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        })
      )
    );

    results.createdCount = createdRecords.length;
    results.error = (results.invalidRows.length > 0 || results.importErrors.length > 0)
      ? "Import completed with errors or skipped duplicates."
      : null;

    await ActivityLogService.log({
      action: "IMPORT_BULK_SERVICES",
      entityType: "BULK_SERVICE",
      entityId: null,
      details: `Imported ${results.createdCount} bulk services. Created ${results.createdServices.length} new services. ${results.invalidRows.length} records had validation or mapping errors.`,
      severity: LogSeverity.INFO,
      userId: currentUser.id,
    });

    revalidatePath("/bulk-services");
    revalidatePath("/services");

    return results;

  } catch (error) {
    console.error("[IMPORT_BULK_SERVICES_ERROR]", error);

    results.error = error instanceof Error ? error.message : "Failed to import bulk services: An unknown error occurred.";
    results.importErrors.push(results.error);
    return results;
  }
}