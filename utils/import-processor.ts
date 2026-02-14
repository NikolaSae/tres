// /utils/import-processor.ts
import { parse as csvParse } from 'csv-parse/sync';
import { PrismaClient, Complaint, ComplaintStatus, User } from '@prisma/client';
import { ComplaintImportData, parseAndValidateCsv, ComplaintImportSchema, validateServiceIds, validateProductIds, validateProviderIds, validateUserIds } from './csv-validator';

export type ImportResult = {
  success: boolean;
  message: string;
  importedCount: number;
  errors: Array<{ row: number; message: string }>;
  complaints?: Complaint[];
};

/**
 * Process a CSV file and import valid complaints
 */
export async function processComplaintImport(
  csvContent: string,
  submittedBy: User,
  db: PrismaClient,
  options = { hasHeaderRow: true }
): Promise<ImportResult> {
  try {
    // Parse and validate CSV data
    const validationResult = parseAndValidateCsv(csvContent, ComplaintImportSchema, options);
    
    if (!validationResult.isValid) {
      return {
        success: false,
        message: 'CSV validation failed',
        importedCount: 0,
        errors: validationResult.errors.map(err => ({
          row: err.row,
          message: `${err.field}: ${err.message}`,
        })),
      };
    }
    
    // ✅ FIX: Filter out items with missing required fields and add defaults
    const validData = validationResult.data.map(item => ({
      ...item,
      status: item.status || ComplaintStatus.NEW,
      priority: item.priority || 3,
    }));
    
    // Validate relationships against database
    const serviceValidation = await validateServiceIds(validData, db);
    const productValidation = await validateProductIds(validData, db);
    const providerValidation = await validateProviderIds(validData, db);
    const userValidation = await validateUserIds(validData, db);
    
    const allErrors = [
      ...serviceValidation.errors,
      ...productValidation.errors,
      ...providerValidation.errors,
      ...userValidation.errors,
    ];
    
    if (allErrors.length > 0) {
      return {
        success: false,
        message: 'Validation failed for referenced entities',
        importedCount: 0,
        errors: allErrors.map(err => ({
          row: err.row,
          message: `${err.field}: ${err.message}`,
        })),
      };
    }
    
    // If all validations pass, create complaints
    const importedComplaints: Complaint[] = [];
    const importErrors: Array<{ row: number; message: string }> = [];
    
    for (let i = 0; i < validData.length; i++) {
      const complaintData = validData[i];
      
      try {
        // ✅ FIX: Ensure status always has a value
        const status = complaintData.status || ComplaintStatus.NEW;
        const needsStatusHistory = status !== ComplaintStatus.NEW;
        
        // Create the complaint with a transaction to ensure status history is created
        const complaint = await db.$transaction(async (tx) => {
          // Create the complaint
          const newComplaint = await tx.complaint.create({
            data: {
              title: complaintData.title,
              description: complaintData.description,
              status: status, // ✅ Now guaranteed to be ComplaintStatus
              priority: complaintData.priority || 3,
              financialImpact: complaintData.financialImpact,
              serviceId: complaintData.serviceId || undefined,
              productId: complaintData.productId || undefined,
              providerId: complaintData.providerId || undefined,
              submittedById: complaintData.submittedById || submittedBy.id,
              // If status is not NEW, set assignedAgent to the submitter and assignedAt to now
              assignedAgentId: status !== ComplaintStatus.NEW ? 
                (complaintData.submittedById || submittedBy.id) : undefined,
              assignedAt: status !== ComplaintStatus.NEW ?
                new Date() : undefined,
            },
          });
          
          // If initial status is not NEW, create a status history entry
          if (needsStatusHistory) {
            await tx.complaintStatusHistory.create({
              data: {
                complaintId: newComplaint.id,
                previousStatus: ComplaintStatus.NEW,
                newStatus: status, // ✅ Now guaranteed to be ComplaintStatus
                changedById: complaintData.submittedById || submittedBy.id,
                notes: 'Status set during import',
              },
            });
          }
          
          // Also create an activity log entry
          await tx.activityLog.create({
            data: {
              action: 'IMPORT_CREATE',
              entityType: 'complaint',
              entityId: newComplaint.id,
              details: `Complaint imported from CSV: ${newComplaint.title}`,
              userId: submittedBy.id,
            },
          });
          
          return newComplaint;
        });
        
        importedComplaints.push(complaint);
      } catch (error) {
        importErrors.push({
          row: i + 2, // +2 to account for header and 0-indexing
          message: error instanceof Error ? error.message : 'Unknown error during import',
        });
      }
    }
    
    return {
      success: importErrors.length === 0,
      message: importErrors.length === 0 
        ? `Successfully imported ${importedComplaints.length} complaints`
        : `Imported ${importedComplaints.length} complaints with ${importErrors.length} errors`,
      importedCount: importedComplaints.length,
      errors: importErrors,
      complaints: importedComplaints,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to process import',
      importedCount: 0,
      errors: [{
        row: 0,
        message: error instanceof Error ? error.message : 'Unknown error',
      }],
    };
  }
}

/**
 * Generate a CSV template for complaint imports
 */
export function generateComplaintImportTemplate(): string {
  const header = [
    'title',
    'description',
    'status',
    'priority',
    'financialImpact',
    'serviceId',
    'productId',
    'providerId',
    'submittedById'
  ].join(',');
  
  const exampleRow = [
    'Sample Complaint',
    'This is a sample complaint description',
    'NEW',
    '3',
    '0',
    '',
    '',
    '',
    ''
  ].join(',');
  
  return `${header}\n${exampleRow}`;
}