//  /actions/reports/humanitarian/core/counter-manager.ts

import { promises as fs } from 'fs';
import path from 'path';
import { REPORTS_BASE_PATH } from '../constants';
import { CounterData, GenerationType } from '../types';

export class GlobalCounterManager {
  private static readonly lockFiles = new Map<string, Promise<void>>();
  private static currentCounterPath: string | null = null;

  private static generateCounterFileName(): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .substring(0, 19);
    
    return `counter_${timestamp}.json`;
  }

  private static async createNewCounterFile(
    month: number,
    year: number,
    generationType: GenerationType
  ): Promise<string> {
    const counterFolderPath = path.join(
      REPORTS_BASE_PATH,
      'global-counters',
      year.toString(),
      month.toString().padStart(2, '0')
    );
    
    await fs.mkdir(counterFolderPath, { recursive: true });

    const fileName = this.generateCounterFileName();
    const filePath = path.join(counterFolderPath, fileName);

    const initialData: CounterData = {
      totalReports: 0,
      validReportsCount: 0,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      month,
      year,
      generationType,
      processedOrganizations: []
    };

    await fs.writeFile(filePath, JSON.stringify(initialData, null, 2));
    console.log(`✅ Created NEW counter file: ${fileName} for ${generationType}`);
    
    return filePath;
  }

  static startNewGeneration(): void {
    this.currentCounterPath = null;
    console.log('🔄 Started new generation - counter will be created on first increment');
  }

  static finishGeneration(): void {
    if (this.currentCounterPath) {
      console.log(`✅ Finished generation using: ${path.basename(this.currentCounterPath)}`);
      this.currentCounterPath = null;
    }
  }

  static async incrementIfValid(
    month: number,
    year: number,
    reportValue: number,
    organizationName: string,
    generationType: GenerationType = 'templates'
  ): Promise<number | null> {
    if (reportValue <= 0) {
      console.log(`${organizationName}: reportValue=${reportValue}, counter se ne uvećava`);
      return null;
    }

    const lockKey = `${year}-${month.toString().padStart(2, '0')}-${generationType}`;
    
    while (this.lockFiles.has(lockKey)) {
      await this.lockFiles.get(lockKey);
    }

    const lockPromise = this._performIncrement(month, year, reportValue, organizationName, generationType);
    this.lockFiles.set(lockKey, lockPromise);

    try {
      return await lockPromise;
    } finally {
      this.lockFiles.delete(lockKey);
    }
  }

  private static async _performIncrement(
    month: number,
    year: number,
    reportValue: number,
    organizationName: string,
    generationType: GenerationType
  ): Promise<number | null> {
    try {
      if (!this.currentCounterPath) {
        this.currentCounterPath = await this.createNewCounterFile(month, year, generationType);
        console.log(`🆕 NEW GENERATION: Created ${path.basename(this.currentCounterPath)}`);
      }

      const fileContent = await fs.readFile(this.currentCounterPath, 'utf8');
      const counterData: CounterData = JSON.parse(fileContent);

      counterData.totalReports += 1;
      counterData.validReportsCount += 1;
      const newCounterValue = counterData.validReportsCount;

      counterData.processedOrganizations.push({
        name: organizationName,
        timestamp: new Date().toISOString(),
        value: reportValue,
        counterAssigned: newCounterValue
      });

      counterData.lastUpdated = new Date().toISOString();

      await fs.writeFile(this.currentCounterPath, JSON.stringify(counterData, null, 2));

      console.log(`${organizationName}: Dodeljen counter broj ${newCounterValue} (reportValue=${reportValue}) [${generationType}]`);
      return newCounterValue;
    } catch (error) {
      console.error(`Error updating global counter for ${month}/${year}:`, error);
      return null;
    }
  }

  static async getCurrentCounter(month: number, year: number): Promise<number> {
    try {
      if (this.currentCounterPath) {
        const fileContent = await fs.readFile(this.currentCounterPath, 'utf8');
        const counterData: CounterData = JSON.parse(fileContent);
        return counterData.validReportsCount || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }
}