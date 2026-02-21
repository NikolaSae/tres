// actions/humanitarian-orgs/import-prepaid-transactions.ts
"use server";

import * as XLSX from 'xlsx';
import { db } from '@/lib/db';
import { auth } from '@/auth';

interface PrepaidRow {
  serviceName: string;
  price: number;
  dailyTransactions: {
    date: Date;
    count: number;
    amount: number;
  }[];
  totalCount: number;
  totalAmount: number;
}

/**
 * Parse humanitarian prepaid Excel file (pivot table format)
 * 
 * Format:
 * - Sheet 4 contains prepaid data
 * - Header row has dates in columns (01.12.2024, 02.12.2024, etc.)
 * - Each service has 2 rows: "Broj" (count) and "Iznos" (amount)
 * - Service name in first column, price in second column
 */
export async function importHumanitarianPrepaidTransactions(
  file: File,
  humanitarianOrgId: string,
  month: Date
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: 'Unauthorized' };
    }

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Get 4th sheet (index 3) - prepaid data
    const sheetName = workbook.SheetNames[3];
    if (!sheetName) {
      return { error: 'Sheet 4 not found in Excel file' };
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    // Parse the data
    const { services, dates } = parseHumanitarianPrepaidData(rawData);

    // Pre-create all missing services
    console.log('Ensuring all services exist...');
    const ensureResults = await ensureServicesExist(services, humanitarianOrgId, session.user.id!);
    console.log(`Services status: ${ensureResults.created} created, ${ensureResults.linked} linked, ${ensureResults.existing} existing`);

    // Get service mapping
    const serviceMap = await getHumanitarianServiceMapping(humanitarianOrgId);

    // Import transactions (no ReportFile needed)
    const transactions = [];
    const errors = [];

    for (const service of services) {
      // Match service
      const serviceCode = extractServiceCode(service.serviceName);
      let serviceId = serviceMap.get(service.serviceName);
      
      if (!serviceId && serviceCode) {
        serviceId = serviceMap.get(serviceCode);
      }

      if (!serviceId) {
        errors.push({
          serviceName: service.serviceName,
          price: service.price,
          error: 'Service not found after auto-creation attempt',
          suggestion: 'Check ensureServicesExist function logs',
        });
        continue;
      }

      // Create transaction for each day with non-zero count
      for (const day of service.dailyTransactions) {
        if (day.count === 0) continue;

        try {
          const transaction = await db.humanitarianTransaction.create({
            data: {
              humanitarianOrgId,
              serviceId,
              date: day.date,
              serviceName: service.serviceName,
              serviceCode,
              price: service.price,
              quantity: day.count,
              amount: day.amount,
              billingType: 'PREPAID',
              description: `${service.serviceName} @ ${service.price} RSD`,
              // Import metadata
              importedFileName: file.name,
              importedById: session.user.id,
            }
          });

          transactions.push(transaction);
        } catch (error: any) {
          if (error.code === 'P2002') {
            console.log(`Skipping duplicate: ${service.serviceName} @ ${service.price} on ${day.date.toISOString()}`);
          } else {
            errors.push({
              serviceName: service.serviceName,
              price: service.price,
              date: day.date,
              error: error.message
            });
          }
        }
      }
    }

    return {
      success: true,
      imported: transactions.length,
      failed: errors.length,
      transactions,
      errors,
      summary: {
        totalServices: services.length,
        totalDays: dates.length,
        month: month.toISOString(),
        dateRange: {
          start: dates[0],
          end: dates[dates.length - 1],
        },
        fileName: file.name,
        servicesCreated: ensureResults.created,
        servicesLinked: ensureResults.linked,
        servicesExisting: ensureResults.existing,
      }
    };

  } catch (error: any) {
    console.error('Error importing humanitarian prepaid transactions:', error);
    return { error: error.message || 'Failed to import transactions' };
  }
}

/**
 * Parse pivot table format prepaid data
 * Stops when encountering postpaid section
 */
function parseHumanitarianPrepaidData(rawData: any[][]) {
  // First row is header with dates
  const headerRow = rawData[0];
  
  // Extract dates from header (skip first 3 columns: service name, price, "Broj/Iznos")
  const dates: Date[] = [];
  for (let i = 3; i < headerRow.length - 1; i++) { // -1 to skip TOTAL column
    const dateStr = headerRow[i];
    if (dateStr && typeof dateStr === 'string') {
      const date = parseDateFromHeader(dateStr);
      if (date) {
        dates.push(date);
      }
    }
  }

  // Parse service rows
  const services: PrepaidRow[] = [];
  
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    
    // STOP if we encounter postpaid section
    if (row[0] && String(row[0]).includes('postpaid')) {
      console.log('Reached postpaid section, stopping prepaid parsing');
      break;
    }
    
    // Skip empty rows
    if (!row[0] || String(row[0]).trim() === '') {
      continue;
    }
    
    // Check if this is a service name row (has service name and price)
    if (row[0] && row[1] && typeof row[1] === 'number') {
      const serviceName = String(row[0]).trim();
      const price = parseFloat(String(row[1]));
      
      // Next row should be "Broj" (count)
      const brojRow = row;
      const iznosRow = rawData[i + 1]; // Amount row
      
      if (!iznosRow) continue;

      // Extract daily transactions
      const dailyTransactions = [];
      
      for (let dayIndex = 0; dayIndex < dates.length; dayIndex++) {
        const columnIndex = dayIndex + 3; // +3 to skip first 3 columns
        
        const countValue = brojRow[columnIndex];
        const amountValue = iznosRow[columnIndex];
        
        // Parse count (handle both number and string)
        const count = countValue ? parseFloat(String(countValue).replace(',', '')) : 0;
        
        // Parse amount (handle both number and string with commas)
        const amount = amountValue ? parseFloat(String(amountValue).replace(',', '')) : 0;
        
        dailyTransactions.push({
          date: dates[dayIndex],
          count,
          amount,
        });
      }

      // Get totals from TOTAL column (last column)
      const totalColumnIndex = row.length - 1;
      const totalCount = brojRow[totalColumnIndex] ? 
        parseFloat(String(brojRow[totalColumnIndex]).replace(',', '')) : 0;
      const totalAmount = iznosRow[totalColumnIndex] ? 
        parseFloat(String(iznosRow[totalColumnIndex]).replace(',', '')) : 0;

      services.push({
        serviceName,
        price,
        dailyTransactions,
        totalCount,
        totalAmount,
      });

      // Skip the "Iznos" row since we already processed it
      i++;
    }
  }

  console.log(`Parsed ${services.length} prepaid services`);
  return { services, dates };
}

/**
 * Parse date from header format "01.12.\n2024."
 */
function parseDateFromHeader(dateStr: string): Date | null {
  try {
    // Remove quotes and newlines
    const cleaned = dateStr.replace(/["\n]/g, '').trim();
    
    // Format: "01.12.2024."
    const match = cleaned.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1; // 0-indexed
      const year = parseInt(match[3]);
      
      return new Date(year, month, day);
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return null;
  }
}

/**
 * Extract service code from service name
 * e.g., "360VRTube" might have code in another column or embedded
 */
function extractServiceCode(serviceName: string): string | null {
  // If service name starts with digits, extract them
  const match = serviceName.match(/^(\d+)/);
  return match ? match[1] : null;
}

/**
 * Pre-create all missing services before import (bulk operation)
 * This is more efficient than creating them one by one during import
 */
async function ensureServicesExist(
  services: PrepaidRow[],
  humanitarianOrgId: string,
  userId: string
) {
  const results = {
    created: 0,
    linked: 0,
    existing: 0,
    errors: [] as any[],
  };

  // Find active contract for this org
  const activeContract = await db.contract.findFirst({
    where: {
      humanitarianOrgId,
      status: {
        in: ['ACTIVE', 'RENEWAL_IN_PROGRESS']
      },
      type: 'HUMANITARIAN',
    },
    include: {
      services: {
        include: {
          service: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (!activeContract) {
    console.warn(`No active contract found for org ${humanitarianOrgId}`);
    return results;
  }

  // Get existing services in contract
  const existingServiceNames = new Set(
    activeContract.services.map(sc => sc.service.name)
  );

  // Get unique service names from import data
  const uniqueServices = Array.from(
    new Map(services.map(s => [s.serviceName, s])).values()
  );

  for (const service of uniqueServices) {
    // Skip if already in contract
    if (existingServiceNames.has(service.serviceName)) {
      results.existing++;
      continue;
    }

    try {
      // Check if service exists in Service table
      let existingService = await db.service.findFirst({
        where: {
          name: service.serviceName,
          type: 'HUMANITARIAN',
        }
      });

      // Create service if doesn't exist
      if (!existingService) {
        existingService = await db.service.create({
          data: {
            name: service.serviceName,
            type: 'HUMANITARIAN',
            description: `Auto-created from humanitarian report - ${service.price} RSD`,
            isActive: true,
            billingType: 'PREPAID',
            createdById: userId,
          }
        });
        
        results.created++;
        console.log(`Created service: ${service.serviceName}`);
      }

      // Link to contract
      const existingLink = await db.serviceContract.findFirst({
        where: {
          contractId: activeContract.id,
          serviceId: existingService.id,
        }
      });

      if (!existingLink) {
        await db.serviceContract.create({
          data: {
            contractId: activeContract.id,
            serviceId: existingService.id,
            specificTerms: `Auto-linked from report import. Base price: ${service.price} RSD`,
          }
        });

        results.linked++;
        console.log(`Linked service ${service.serviceName} to contract`);
      }

    } catch (error: any) {
      results.errors.push({
        serviceName: service.serviceName,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Get service mapping for humanitarian organization
 */
async function getHumanitarianServiceMapping(humanitarianOrgId: string) {
  const contracts = await db.contract.findMany({
    where: {
      humanitarianOrgId,
      status: {
        in: ['ACTIVE', 'RENEWAL_IN_PROGRESS']
      }
    },
    include: {
      services: {
        include: {
          service: true
        }
      }
    }
  });

  const serviceMap = new Map<string, string>();

  contracts.forEach(contract => {
    contract.services.forEach(sc => {
      // Map by service name
      serviceMap.set(sc.service.name, sc.service.id);
      
      // Map by service code if exists
      // Assuming Service model has a 'code' field - adjust if needed
      // if (sc.service.code) {
      //   serviceMap.set(sc.service.code, sc.service.id);
      // }
    });
  });

  return serviceMap;
}

/**
 * Get summary statistics for imported month
 */
export async function getHumanitarianMonthSummary(
  humanitarianOrgId: string,
  month: Date
) {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const summary = await db.humanitarianTransaction.groupBy({
    by: ['serviceId', 'serviceName'],
    where: {
      humanitarianOrgId,
      date: {
        gte: startDate,
        lte: endDate,
      }
    },
    _sum: {
      amount: true,
      quantity: true,
    },
    _count: {
      id: true,
    }
  });

  // Get total
  const total = await db.humanitarianTransaction.aggregate({
    where: {
      humanitarianOrgId,
      date: {
        gte: startDate,
        lte: endDate,
      }
    },
    _sum: {
      amount: true,
      quantity: true,
    },
    _count: {
      id: true,
    }
  });

  return {
    byService: summary,
    total,
    period: {
      startDate,
      endDate,
      month: month.toLocaleString('sr-RS', { month: 'long', year: 'numeric' })
    }
  };
}
