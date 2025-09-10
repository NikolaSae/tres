// actions/reports/reset-monthly-counters.ts

'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { db } from "@/lib/db";

interface CounterResetResult {
  success: boolean;
  message: string;
  processed: number;
  errors?: string[];
  resetOrganizations?: {
    organizationName: string;
    organizationId: string;
    status: 'success' | 'error';
    message?: string;
  }[];
}

const REPORTS_BASE_PATH = path.join(process.cwd(), 'reports');

export async function resetMonthlyCounters(
  month: number,
  year: number
): Promise<CounterResetResult> {
  const resetOrganizations: CounterResetResult['resetOrganizations'] = [];
  const errors: string[] = [];

  try {
    // Get all active humanitarian organizations
    const organizations = await db.humanitarianOrg.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true
      }
    });

    if (organizations.length === 0) {
      return {
        success: false,
        message: 'Nije pronađena nijedna aktivna humanitarna organizacija',
        processed: 0
      };
    }

    // Process each organization
    for (const org of organizations) {
      try {
        const result = await resetCounterForOrganization(org.id, org.name, month, year);
        resetOrganizations.push(result);
      } catch (error) {
        const errorMsg = `Greška za ${org.name}: ${error instanceof Error ? error.message : 'Nepoznata greška'}`;
        errors.push(errorMsg);

        resetOrganizations.push({
          organizationName: org.name,
          organizationId: org.id,
          status: 'error',
          message: errorMsg
        });
      }
    }

    const successCount = resetOrganizations.filter(o => o.status === 'success').length;

    return {
      success: successCount > 0,
      message: `Uspešno resetovano ${successCount} od ${organizations.length} brojača`,
      processed: successCount,
      errors: errors.length > 0 ? errors : undefined,
      resetOrganizations
    };
  } catch (error) {
    console.error('Error in resetMonthlyCounters:', error);
    return {
      success: false,
      message: 'Greška pri resetovanju brojača',
      processed: 0,
      errors: [error instanceof Error ? error.message : 'Nepoznata greška']
    };
  }
}

async function resetCounterForOrganization(
  orgId: string,
  orgName: string,
  month: number,
  year: number
): Promise<NonNullable<CounterResetResult['resetOrganizations']>[0]> {
  try {
    const counterFolderPath = path.join(
      REPORTS_BASE_PATH,
      orgId,
      year.toString(),
      month.toString().padStart(2, '0')
    );
    const counterFilePath = path.join(counterFolderPath, 'counter.json');

    // Create folder if it doesn't exist
    await fs.mkdir(counterFolderPath, { recursive: true });

    // Reset oba brojača na 0
    const counterData = {
      totalReports: 0,
      validReportsCount: 0,
      lastUpdated: new Date().toISOString(),
      lastReset: new Date().toISOString(),
      month,
      year,
      organizationId: orgId,
      resetReason: 'Manual reset via admin panel'
    };

    await fs.writeFile(counterFilePath, JSON.stringify(counterData, null, 2));

    return {
      organizationName: orgName,
      organizationId: orgId,
      status: 'success'
    };
  } catch (error) {
    throw new Error(`Greška pri resetovanju brojača: ${error instanceof Error ? error.message : 'Nepoznata greška'}`);
  }
}
