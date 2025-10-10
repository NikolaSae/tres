// utils/parking-reports-helper.ts


export function getMonthName(month: number | string): string {
  const monthNum = typeof month === 'string' ? parseInt(month) : month;
  
  const months = [
    'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
    'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
  ];
  
  return months[monthNum - 1] || 'Nepoznat mesec';
}

/**
 * Detektuje tip izveštaja na osnovu imena fajla
 * 
 * VAŽNO: MicropaymentMerchantReport izveštaji su POSTPAID
 */
export function detectReportType(filename: string): 'PREPAID' | 'POSTPAID' {
  const lower = filename.toLowerCase();
  
  // Explicit PREPAID markers
  if (lower.includes('prepaid') || 
      lower.includes('pre-paid') || 
      lower.includes('pre_paid') ||
      lower.includes('pretplaceni') ||
      lower.includes('prepay')) {
    return 'PREPAID';
  }
  
  // Explicit POSTPAID markers
  if (lower.includes('postpaid') || 
      lower.includes('post-paid') || 
      lower.includes('post_paid') ||
      lower.includes('naknadno') ||
      lower.includes('postpay')) {
    return 'POSTPAID';
  }
  
  // MicropaymentMerchantReport = POSTPAID
  if (lower.includes('micropayment') || 
      lower.includes('merchantreport') ||
      lower.includes('merchant')) {
    return 'POSTPAID';
  }
  
  // Default je POSTPAID jer su to najčešći izveštaji
  return 'POSTPAID';
}

/**
 * Normalizuje naziv servisa za putanju fajla
 * Primer: "Parking Aleksandrovac" -> "aleksandrovac"
 */
export function normalizeServiceName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/^parking\s+/i, '') // Ukloni "Parking" prefix
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Formatira mesec bez водеће nule
 * Primer: "08" -> "8"
 */
export function formatMonthForPath(month: number | string): string {
  return parseInt(month.toString()).toString();
}