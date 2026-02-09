//  /actions/reports/humanitarian/data/fetch-organizations.ts

import { db } from "@/lib/db";
import { startOfMonth, endOfMonth } from 'date-fns';
import path from 'path';
import { promises as fs } from 'fs';
import { OrganizationReportData, PaymentType, OrganizationData } from '../types';
import { ORIGINAL_REPORTS_PATH } from '../constants';
import { generateOrganizationFolderName } from '@/utils/report-path';
import { isFileForPeriodAndPaymentType, isFileForPaymentType } from '../utils/date-parser';
import { readExcelValue } from '../core/excel-reader';
import { extractLastRowValues } from '@/actions/reports/humanitarian/core/excel-reader';

export async function getOrganizationsWithReportData(
  month: number,
  year: number,
  paymentType: PaymentType
): Promise<OrganizationReportData[]> {
  const currentDate = new Date();
  
  const organizations = await db.humanitarianOrg.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      accountNumber: true,
      registrationNumber: true,
      pib: true,
      shortNumber: true,
      mission: true,
      bank: true,
      contracts: {
        where: {
          status: 'ACTIVE',
          startDate: { lte: currentDate },
          endDate: { gte: currentDate }
        },
        select: {
          name: true,
          contractNumber: true,
          startDate: true,
        },
        orderBy: {
          startDate: 'desc'
        },
        take: 1
      }
    }
  });

  console.log(`\n=== FETCHED ${organizations.length} ORGANIZATIONS ===\n`);

  const enhancedOrganizations: OrganizationReportData[] = [];

  for (const org of organizations) {
    console.log(`\n📋 Processing: ${org.name}`);
    
    if (org.contracts.length === 0) {
      console.log(`   ⚠️ NO ACTIVE CONTRACTS - Fetching fallback...`);
      try {
        const fallbackContract = await db.contract.findFirst({
          where: { 
            humanitarianOrgId: org.id,
            status: 'ACTIVE'
          },
          select: {
            name: true,
            contractNumber: true,
            startDate: true,
          },
          orderBy: { startDate: 'desc' }
        });
        
        if (fallbackContract) {
          console.log(`   ✅ FALLBACK: Using most recent contract: ${fallbackContract.name}`);
          org.contracts = [fallbackContract];
        }
      } catch (debugError) {
        console.error(`   ❌ Error fetching fallback contract:`, debugError);
      }
    }

    const monthlyData = await getMonthlyDataForOrganization(
      org.id, 
      org.shortNumber || '', 
      month, 
      year, 
      paymentType
    );

    const serializedContracts = (org.contracts || []).map(contract => {
      let parsedDate: Date | null = null;
      
      if (contract.startDate) {
        try {
          const dateToConvert = contract.startDate;
          
          if (typeof dateToConvert === 'string') {
            parsedDate = new Date(dateToConvert);
          } else if (dateToConvert instanceof Date) {
            parsedDate = new Date(dateToConvert.getTime());
          } else {
            // Handle any other type by attempting to convert to string first
            parsedDate = new Date(String(dateToConvert));
          }
          
          if (!parsedDate || isNaN(parsedDate.getTime())) {
            console.error(`   ❌ Invalid date for ${org.name}`);
            parsedDate = null;
          } else {
            console.log(`   ✅ Parsed startDate for ${org.name}: ${parsedDate.toISOString()}`);
          }
        } catch (err) {
          console.error(`   ❌ Date parsing error for ${org.name}:`, err);
          parsedDate = null;
        }
      } else {
        console.warn(`   ⚠️ ${org.name}: contract.startDate is NULL in database!`);
      }
      
      return {
        name: contract.name,
        contractNumber: contract.contractNumber,
        startDate: parsedDate,
      };
    });

    enhancedOrganizations.push({
      ...org,
      contracts: serializedContracts,
      monthlyRevenue: monthlyData.revenue,
      totalTransactions: monthlyData.transactions,
      serviceUsage: monthlyData.serviceUsage
    });
  }

  return enhancedOrganizations;
}

async function getMonthlyDataForOrganization(
  orgId: string,
  shortNumber: string,
  month: number,
  year: number,
  paymentType: PaymentType
) {
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  try {
    return {
      revenue: 0,
      transactions: 0,
      serviceUsage: { postpaid: 0, prepaid: 0 }
    };
  } catch (error) {
    console.error(`Error fetching data for organization ${orgId}:`, error);
    return {
      revenue: 0,
      transactions: 0,
      serviceUsage: { postpaid: 0, prepaid: 0 }
    };
  }
}

export async function getOriginalReportValue(
  orgData: OrganizationData,
  month: number,
  year: number,
  paymentType: PaymentType
): Promise<number> {
  try {
    const orgFolderName = generateOrganizationFolderName(orgData.shortNumber || 'unknown', orgData.name);
    
    const originalReportPath = path.join(
      ORIGINAL_REPORTS_PATH,
      orgFolderName,
      year.toString(),
      month.toString().padStart(2, '0'),
      paymentType
    );

    let files: string[] = [];
    try {
      files = await fs.readdir(originalReportPath);
    } catch (error) {
      console.log(`❌ Original reports directory not found: ${originalReportPath}`);
      return 0;
    }

    // ✅ Filtriraj fajlove koji počinju sa "complete_"
    files = files.filter(f => !f.startsWith('complete_'));

    let xlsFile = files.find(f => {
      const isExcel = f.toLowerCase().endsWith('.xls') || f.toLowerCase().endsWith('.xlsx');
      if (!isExcel) return false;
      
      return isFileForPeriodAndPaymentType(f, month, year, paymentType);
    });

    if (!xlsFile) {
      xlsFile = files.find(f => {
        const isExcel = f.toLowerCase().endsWith('.xls') || f.toLowerCase().endsWith('.xlsx');
        return isExcel && isFileForPaymentType(f, paymentType);
      });
    }

    if (!xlsFile) {
      xlsFile = files.find(f => f.toLowerCase().endsWith('.xls') || f.toLowerCase().endsWith('.xlsx'));
    }

    if (!xlsFile) {
      console.log(`❌ No Excel file found for ${paymentType}`);
      return 0;
    }

    const filePath = path.join(originalReportPath, xlsFile);
    return await readExcelValue(filePath, paymentType);
    
  } catch (error) {
    console.error(`❌ Error reading original report for ${orgData.name}:`, error);
    return 0;
  }
}

export async function getPrepaidLastRowValuesForOrg(
  orgData: OrganizationData,
  month: number,
  year: number
): Promise<Array<string | number | null>> {
  try {
    const orgFolderName = generateOrganizationFolderName(orgData.shortNumber || 'unknown', orgData.name);

    const originalReportPath = path.join(
      ORIGINAL_REPORTS_PATH,
      orgFolderName,
      year.toString(),
      month.toString().padStart(2, '0'),
      'prepaid'
    );

    let files: string[] = [];
    try {
      files = await fs.readdir(originalReportPath);
    } catch (error) {
      // directory not found -> return nulls
      return ['','', '', ''].map(() => null);
    }

    // ✅ Filtriraj fajlove koji počinju sa "complete_"
    files = files.filter(f => !f.startsWith('complete_'));

    // prefer files matching period+prepaid, then fallback to any prepaid file
    let xlsFile = files.find(f => {
      const isExcel = f.toLowerCase().endsWith('.xls') || f.toLowerCase().endsWith('.xlsx');
      if (!isExcel) return false;
      return isFileForPeriodAndPaymentType(f, month, year, 'prepaid');
    });

    if (!xlsFile) {
      xlsFile = files.find(f => {
        const isExcel = f.toLowerCase().endsWith('.xls') || f.toLowerCase().endsWith('.xlsx');
        if (!isExcel) return false;
        return isFileForPaymentType(f, 'prepaid');
      });
    }

    if (!xlsFile) {
      xlsFile = files.find(f => f.toLowerCase().endsWith('.xls') || f.toLowerCase().endsWith('.xlsx'));
    }

    if (!xlsFile) {
      return ['','', '', ''].map(() => null);
    }

    const filePath = path.join(originalReportPath, xlsFile);
    const values = await extractLastRowValues(filePath, ['B', 'C', 'D', 'E']);
    return values;
  } catch (error) {
    console.error('getPrepaidLastRowValuesForOrg error for', orgData.name, error);
    return ['','', '', ''].map(() => null);
  }
}