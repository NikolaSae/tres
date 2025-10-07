// /actions/reports/humanitarian/utils/date-utils.ts
export function getMonthName(month: number): string {
  const months = [
    'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
    'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
  ];
  return months[month - 1];
}

export function getPreviousMonthName(month: number, year: number): string {
  const prevMonth = month === 1 ? 12 : month - 1;
  return getMonthName(prevMonth);
}
