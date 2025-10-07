// /actions/reports/humanitarian/utils/date-parser.ts


import { DateParseResult, PaymentType } from '../types';

export function extractDatesFromFileName(fileName: string): DateParseResult {
  console.log('Parsing filename:', fileName);

  const datePatternFull = /__(\d{8}_\d{4})__(\d{8}_\d{4})\./;
  const matchFull = fileName.match(datePatternFull);

  if (matchFull) {
    const [, startDateStr, endDateStr] = matchFull;
    
    const parseDateTime = (dateStr: string): Date => {
      return new Date(
        parseInt(dateStr.substr(0, 4)),
        parseInt(dateStr.substr(4, 2)) - 1,
        parseInt(dateStr.substr(6, 2)),
        parseInt(dateStr.substr(9, 2)),
        parseInt(dateStr.substr(11, 2))
      );
    };

    const startDate = parseDateTime(startDateStr);
    const endDate = parseDateTime(endDateStr);
    const dayOfMonth = parseInt(startDateStr.substr(6, 2));

    return {
      startDate,
      endDate,
      month: startDate.getMonth() + 1,
      year: startDate.getFullYear(),
      dayOfMonth,
      isValid: true
    };
  }

  const datePatternSingle = /(\d{8})(?:[_\.]|$)/;
  const matchSingle = fileName.match(datePatternSingle);

  if (matchSingle) {
    const dateStr = matchSingle[1];
    const year = parseInt(dateStr.substr(0, 4));
    const month = parseInt(dateStr.substr(4, 2));
    const day = parseInt(dateStr.substr(6, 2));

    const startDate = new Date(year, month - 1, day, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59);

    return {
      startDate,
      endDate,
      month,
      year,
      dayOfMonth: day,
      isValid: true
    };
  }

  return {
    startDate: null,
    endDate: null,
    month: null,
    year: null,
    dayOfMonth: undefined,
    isValid: false
  };
}

export function isFileForPaymentType(
  fileName: string, 
  paymentType: PaymentType, 
  dateInfo?: DateParseResult
): boolean {
  const lowerFileName = fileName.toLowerCase();
  
  if (lowerFileName.includes('postpaid')) {
    return paymentType === 'postpaid';
  }
  
  if (lowerFileName.includes('prepaid')) {
    return paymentType === 'prepaid';
  }
  
  if (!dateInfo) {
    dateInfo = extractDatesFromFileName(fileName);
  }
  
  if (dateInfo.isValid && dateInfo.dayOfMonth !== undefined) {
    const isPostpaid = dateInfo.dayOfMonth >= 5;
    return (paymentType === 'postpaid' && isPostpaid) || 
           (paymentType === 'prepaid' && !isPostpaid);
  }
  
  return paymentType === 'prepaid';
}

export function isFileForPeriodAndPaymentType(
  fileName: string, 
  targetMonth: number, 
  targetYear: number, 
  paymentType: PaymentType
): boolean {
  const dates = extractDatesFromFileName(fileName);
  
  if (!dates.isValid) {
    return false;
  }
  
  const dateMatches = dates.month === targetMonth && dates.year === targetYear;
  const paymentMatches = isFileForPaymentType(fileName, paymentType, dates);
  
  return dateMatches && paymentMatches;
}