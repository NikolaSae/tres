// actions/reports/reset-monthly-counters.ts - POPRAVLJENA VERZIJA
'use server';

import { promises as fs } from 'fs';
import path from 'path';

interface CounterResetResult {
  success: boolean;
  message: string;
  processed: number;
  errors?: string[];
  resetDetails?: {
    month: number;
    year: number;
    previousCount: number;
    newCount: number;
    resetTimestamp: string;
  };
}

const REPORTS_BASE_PATH = path.join(process.cwd(), 'reports');

// ✅ NOVA IMPLEMENTACIJA - Resetuje GLOBALNI counter, ne po organizaciji
export async function resetMonthlyCounters(
  month: number,
  year: number
): Promise<CounterResetResult> {
  try {
    // Validate input parameters
    if (!month || !year || month < 1 || month > 12) {
      return {
        success: false,
        message: 'Nevalidni parametri: mesec mora biti između 1 i 12',
        processed: 0,
        errors: ['Nevalidni parametri za mesec ili godinu']
      };
    }

    // ✅ Resetuj GLOBALNI counter umesto po organizaciji
    const result = await resetGlobalCounter(month, year);
    
    return {
      success: result.success,
      message: result.success 
        ? `Uspešno resetovan globalni counter za ${month}/${year}`
        : `Greška pri resetovanju globalnog countera za ${month}/${year}`,
      processed: result.success ? 1 : 0,
      errors: result.success ? undefined : [result.error || 'Nepoznata greška'],
      resetDetails: result.success ? result.resetDetails : undefined
    };
  } catch (error) {
    console.error('Error in resetMonthlyCounters:', error);
    return {
      success: false,
      message: 'Greška pri resetovanju globalnog countera',
      processed: 0,
      errors: [error instanceof Error ? error.message : 'Nepoznata greška']
    };
  }
}

async function resetGlobalCounter(
  month: number,
  year: number
): Promise<{
  success: boolean;
  error?: string;
  resetDetails?: {
    month: number;
    year: number;
    previousCount: number;
    newCount: number;
    resetTimestamp: string;
  };
}> {
  try {
    const counterFolderPath = path.join(
      REPORTS_BASE_PATH,
      'global-counters',  // ✅ Globalni counter folder
      year.toString(),
      month.toString().padStart(2, '0')
    );
    
    const counterFilePath = path.join(counterFolderPath, 'counter.json');

    // Pročitaj postojeći counter da vidiš prethodnu vrednost
    let previousCount = 0;
    try {
      const existingData = await fs.readFile(counterFilePath, 'utf8');
      const parsed = JSON.parse(existingData);
      previousCount = parsed.validReportsCount || 0;
    } catch (error) {
      // Counter fajl ne postoji, previousCount ostaje 0
    }

    // Kreiraj folder ako ne postoji
    await fs.mkdir(counterFolderPath, { recursive: true });

    // Resetuj counter na 0
    const resetTimestamp = new Date().toISOString();
    const counterData = {
      totalReports: 0,
      validReportsCount: 0,
      lastUpdated: resetTimestamp,
      lastReset: resetTimestamp,
      month,
      year,
      resetReason: 'Manual reset via admin panel',
      processedOrganizations: [] as Array<{
        name: string,
        timestamp: string,
        value: number,
        counted: boolean
      }>
    };

    await fs.writeFile(counterFilePath, JSON.stringify(counterData, null, 2));

    console.log(`✅ Global counter reset for ${month}/${year}: ${previousCount} → 0`);

    return {
      success: true,
      resetDetails: {
        month,
        year,
        previousCount,
        newCount: 0,
        resetTimestamp
      }
    };
  } catch (error) {
    console.error(`Error resetting global counter for ${month}/${year}:`, error);
    return {
      success: false,
      error: `Greška pri resetovanju globalnog countera: ${error instanceof Error ? error.message : 'Nepoznata greška'}`
    };
  }
}