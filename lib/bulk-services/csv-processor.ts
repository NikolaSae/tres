///lib/bulk-services/csv-processor.ts
// lib/bulk-services/csv-processor.ts

import Papa from 'papaparse';
import { BulkServiceValidationError, BulkServiceData } from '@/lib/types/bulk-service-types';

/**
 * Parse the CSV content for bulk service imports
 */
export async function parseBulkServiceCSV(csvContent: string) {
  const data: BulkServiceData[] = [];
  const errors: BulkServiceValidationError[] = [];

  // Use Papa.parse to parse the CSV content
  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: header => header.trim(), // Trim whitespace from headers
    // Optional: Add error handling for Papa.parse
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

  // Process each row of parsed data
  parseResult.data.forEach((row: any, index: number) => {
    const rowErrors = [];

    // Required fields validation
    const requiredFields = ['provider_name', 'agreement_name', 'service_name', 'step_name', 'sender_name', 'requests', 'message_parts'];
    
    for (const field of requiredFields) {
      if (!row[field] || row[field].trim() === '') {
        rowErrors.push(`Missing required field: ${field}`);
      }
    }

    // Check if requests and message_parts are valid integers
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
      // Clean and transform the data
      data.push({
        provider_name: row.provider_name.trim(),
        agreement_name: row.agreement_name.trim(),
        service_name: row.service_name.trim(),
        step_name: row.step_name.trim(),
        sender_name: row.sender_name.trim(),
        requests: parseInt(row.requests),
        message_parts: parseInt(row.message_parts),
        // These will be populated during processing
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
  
  // Debug info
  let processedCount = 0;
  let providerNotFoundCount = 0;
  let serviceNotFoundCount = 0;

  // Process each row
  data.forEach((row, index) => {
    processedCount++;
    const rowErrors = [];
    const originalRow = { ...row };
    
    // Convert to lowercase for lookup
    const providerNameLower = row.provider_name.toLowerCase();
    
    // Generate composite service name (same as in the import function)
    const compositeServiceName = `${row.provider_name}-${row.agreement_name}-${row.service_name}-${row.step_name}-${row.sender_name}`;
    const compositeServiceNameLower = compositeServiceName.toLowerCase();

    // Find provider ID
    const providerId = providerMap.get(providerNameLower);
    if (!providerId) {
      rowErrors.push(`Provider "${row.provider_name}" not found in system.`);
      providerNotFoundCount++;
    } else {
      row.providerId = providerId;
    }

    // Find service ID using the composite service name 
    const serviceId = serviceMap.get(compositeServiceNameLower);
    if (!serviceId) {
      rowErrors.push(`Service with composite name "${compositeServiceName}" not found in system.`);
      serviceNotFoundCount++;
      
      // Additional debug info
      if (processedCount <= 5 || index % 100 === 0) {
        console.log(`Service lookup failed for "${compositeServiceNameLower}", available: ${Array.from(serviceMap.keys()).slice(0, 3)}...`);
      }
    } else {
      row.serviceId = serviceId;
    }

    // Add to appropriate result array
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

  // Log summary for debugging
  if (providerNotFoundCount > 0 || serviceNotFoundCount > 0) {
    console.log(`CSV Processing Summary: Processed ${processedCount} rows, Provider not found: ${providerNotFoundCount}, Service not found: ${serviceNotFoundCount}`);
    importErrors.push(`Provider mapping failures: ${providerNotFoundCount}, Service mapping failures: ${serviceNotFoundCount}`);
  }

  return { validRows, invalidRows, importErrors };
}