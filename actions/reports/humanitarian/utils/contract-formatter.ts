//  /actions/reports/humanitarian/utils/contract-formatter.ts

import { format } from 'date-fns';
import { OrganizationReportData } from '../types';

export function formatContractInfo(contracts: OrganizationReportData['contracts']): string {
  console.log('\n🔍 === formatContractInfo DEBUG ===');
  console.log('Input contracts:', JSON.stringify(contracts, null, 2));
  
  if (!contracts || !Array.isArray(contracts) || contracts.length === 0) {
    console.log('❌ No contracts array or empty array');
    return '';
  }
  
  const activeContract = contracts[0];
  console.log('Active contract object:', activeContract);
  
  if (!activeContract.name) {
    console.log('❌ Contract name is missing');
    return '';
  }
  
  let startDate: Date | null = null;
  if (activeContract.startDate) {
    try {
      if (activeContract.startDate instanceof Date) {
        startDate = activeContract.startDate;
      } else {
        startDate = new Date(activeContract.startDate as any);
      }
      
      if (isNaN(startDate.getTime())) {
        console.log('❌ Invalid date (NaN):', activeContract.startDate);
        startDate = null;
      } else {
        console.log('✅ Valid date parsed:', startDate.toISOString());
      }
    } catch (error) {
      console.error('❌ Error parsing startDate:', error);
      startDate = null;
    }
  }
  
  if (activeContract.name && startDate) {
    const formattedDate = format(startDate, 'dd.MM.yyyy');
    const result = `Уговор бр ${activeContract.name} од ${formattedDate}`;
    console.log('✅ SUCCESS: Contract info with date:', result);
    return result;
  }
  
  if (activeContract.name) {
    const result = `Уговор бр ${activeContract.name}`;
    console.log('⚠️ PARTIAL: Contract info without date:', result);
    return result;
  }
  
  console.log('❌ FAILED: No contract name found');
  return '';
}