// /utils/date-filters.ts
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, subWeeks, subMonths, subQuarters, subYears, format } from 'date-fns';

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

export type DateFilterOption = 
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'lastYear'
  | 'last7Days'
  | 'last30Days'
  | 'last90Days'
  | 'allTime';

// Add the missing formatDate function
export function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}

export function getDateRange(option: DateFilterOption): DateRange {
  const now = new Date();
  
  switch (option) {
    case 'today':
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now)
      };
    
    case 'yesterday': {
      const yesterday = subDays(now, 1);
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday)
      };
    }
    
    case 'thisWeek':
      return {
        startDate: startOfWeek(now, { weekStartsOn: 1 }), // Start week on Monday
        endDate: endOfWeek(now, { weekStartsOn: 1 })
      };
    
    case 'lastWeek': {
      const lastWeek = subWeeks(now, 1);
      return {
        startDate: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        endDate: endOfWeek(lastWeek, { weekStartsOn: 1 })
      };
    }
    
    case 'thisMonth':
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now)
      };
    
    case 'lastMonth': {
      const lastMonth = subMonths(now, 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth)
      };
    }
    
    case 'thisQuarter':
      return {
        startDate: startOfQuarter(now),
        endDate: endOfQuarter(now)
      };
      
    case 'lastQuarter': {
      const lastQuarter = subQuarters(now, 1);
      return {
        startDate: startOfQuarter(lastQuarter),
        endDate: endOfQuarter(lastQuarter)
      };
    }
    
    case 'thisYear':
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now)
      };
      
    case 'lastYear': {
      const lastYear = subYears(now, 1);
      return {
        startDate: startOfYear(lastYear),
        endDate: endOfYear(lastYear)
      };
    }
    
    case 'last7Days':
      return {
        startDate: startOfDay(subDays(now, 6)), // 6 days ago + today = 7 days
        endDate: endOfDay(now)
      };
    
    case 'last30Days':
      return {
        startDate: startOfDay(subDays(now, 29)), // 29 days ago + today = 30 days
        endDate: endOfDay(now)
      };
    
    case 'last90Days':
      return {
        startDate: startOfDay(subDays(now, 89)), // 89 days ago + today = 90 days
        endDate: endOfDay(now)
      };
    
    case 'allTime':
      return {
        startDate: new Date(0), // Unix epoch start
        endDate: endOfDay(now)
      };
      
    default:
      return {
        startDate: startOfDay(subDays(now, 29)), // Default to last 30 days
        endDate: endOfDay(now)
      };
  }
}

export function formatDateRange(range: DateRange): string {
  const { startDate, endDate } = range;
  
  const startStr = startDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const endStr = endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  if (startStr === endStr) {
    return startStr;
  }
  
  return `${startStr} - ${endStr}`;
}

export function isDateInRange(date: Date, range: DateRange): boolean {
  const timestamp = date.getTime();
  return timestamp >= range.startDate.getTime() && timestamp <= range.endDate.getTime();
}

export function getDaysInRange(range: DateRange): number {
  const diffTime = Math.abs(range.endDate.getTime() - range.startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include the end day
}