// lib/bulk-services/csv-processor.ts

import Papa from 'papaparse';
import { BulkServiceValidationError, BulkServiceData } from '@/lib/types/bulk-service-types';

/**
 * Parse the CSV content for bulk service imports
 */
export async function parseBulkServiceCSV(csvContent: string) {
  const data: BulkServiceData[] = [];
  const errors: BulkServiceValidationError[] = [];

  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: header => header.trim(),
    error: (err) => {
      errors.push({
        rowIndex: -1,
        errors: [`CSV parsing error: ${err.message}`],
        originalRow: {}
      });
    }
  });

  if (parseResult.errors && parseResult.errors.length > 0) {
    parseResult.errors.forEach(err => {
      errors.push({
        rowIndex: err.row || -1,
        errors: [`Parse error at row ${err.row}: ${err.message}`],
        originalRow: err.row !== undefined ? parseResult.data[err.row] : {}
      });
    });
  }

  parseResult.data.forEach((row: any, index: number) => {
    const rowErrors = [];

    const requiredFields = ['provider_name', 'agreement_name', 'service_name', 'step_name', 'sender_name', 'requests', 'message_parts'];
    
    for (const field of requiredFields) {
      if (!row[field] || row[field].trim() === '') {
        rowErrors.push(`Missing required field: ${field}`);
      }
    }

    if (row.requests && isNaN(parseInt(row.requests))) {
      rowErrors.push('Requests must be a valid number');
    }

    if (row.message_parts && isNaN(parseInt(row.message_parts))) {
      rowErrors.push('Message parts must be a valid number');
    }

    if (rowErrors.length > 0) {
      errors.push({
        rowIndex: index,
        errors: rowErrors,
        originalRow: row
      });
    } else {
      data.push({
        provider_name: row.provider_name.trim(),
        agreement_name: row.agreement_name.trim(),
        service_name: row.service_name.trim(),
        step_name: row.step_name.trim(),
        sender_name: row.sender_name.trim(),
        requests: parseInt(row.requests),
        message_parts: parseInt(row.message_parts),
        providerId: null,
        serviceId: null
      });
    }
  });

  return { data, errors };
}

/**
 * Process the parsed CSV data - map provider and service names to IDs
 */
export function processBulkServiceCsv(
  data: BulkServiceData[],
  providerMap: Map<string, string>,
  serviceMap: Map<string, string>
) {
  const validRows: BulkServiceData[] = [];
  const invalidRows: BulkServiceValidationError[] = [];
  const importErrors: string[] = [];
  
  let processedCount = 0;
  let providerNotFoundCount = 0;
  let serviceNotFoundCount = 0;

  data.forEach((row, index) => {
    processedCount++;
    const rowErrors = [];
    const originalRow = { ...row };
    
    const providerNameLower = row.provider_name.toLowerCase();
    
    const compositeServiceName = `${row.provider_name}-${row.agreement_name}-${row.service_name}-${row.step_name}-${row.sender_name}`;
    const compositeServiceNameLower = compositeServiceName.toLowerCase();

    const providerId = providerMap.get(providerNameLower);
    if (!providerId) {
      rowErrors.push(`Provider "${row.provider_name}" not found in system.`);
      providerNotFoundCount++;
    } else {
      row.providerId = providerId;
    }

    const serviceId = serviceMap.get(compositeServiceNameLower);
    if (!serviceId) {
      rowErrors.push(`Service with composite name "${compositeServiceName}" not found in system.`);
      serviceNotFoundCount++;
      
      if (processedCount <= 5 || index % 100 === 0) {
        console.log(`Service lookup failed for "${compositeServiceNameLower}", available: ${Array.from(serviceMap.keys()).slice(0, 3)}...`);
      }
    } else {
      row.serviceId = serviceId;
    }

    if (rowErrors.length > 0) {
      invalidRows.push({
        rowIndex: index,
        errors: rowErrors,
        originalRow
      });
    } else {
      validRows.push(row);
    }
  });

  if (providerNotFoundCount > 0 || serviceNotFoundCount > 0) {
    console.log(`CSV Processing Summary: Processed ${processedCount} rows, Provider not found: ${providerNotFoundCount}, Service not found: ${serviceNotFoundCount}`);
    importErrors.push(`Provider mapping failures: ${providerNotFoundCount}, Service mapping failures: ${serviceNotFoundCount}`);
  }

  return { validRows, invalidRows, importErrors };
}

/**
 * Formatira niz bulk servisa u CSV string spreman za download/eksport
 * @param bulkServices Niz objekata iz baze
 */
export function formatBulkServiceCSV(
  bulkServices: Array<{
    id: string;
    provider_name: string;
    agreement_name: string;
    service_name: string;
    step_name: string;
    sender_name: string;
    requests: number;
    message_parts: number;
    createdAt?: Date | string;
    datumNaplate?: Date | string | null;
    // Dodaj ostala polja po potrebi
  }>
): string {
  const headers = [
    "Provider Name",
    "Agreement Name",
    "Service Name",
    "Step Name",
    "Sender Name",
    "Requests",
    "Message Parts",
    "Created At",
    "Datum Naplate",
  ];

  const rows = bulkServices.map((service) => [
    `"${(service.provider_name || "").replace(/"/g, '""')}"`,
    `"${(service.agreement_name || "").replace(/"/g, '""')}"`,
    `"${(service.service_name || "").replace(/"/g, '""')}"`,
    `"${(service.step_name || "").replace(/"/g, '""')}"`,
    `"${(service.sender_name || "").replace(/"/g, '""')}"`,
    service.requests ?? 0,
    service.message_parts ?? 0,
    service.createdAt ? new Date(service.createdAt).toISOString().split('T')[0] : "",
    service.datumNaplate ? new Date(service.datumNaplate).toISOString().split('T')[0] : "",
  ]);

  return Papa.unparse({
    fields: headers,
    data: rows,
  }, {
    delimiter: ",",
    quoteChar: '"',
    escapeChar: '"',
    header: true,
  });
}