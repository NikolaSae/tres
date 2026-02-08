//lib/analytics/financial-calculations.ts
export function calculateFinancialMetrics(data: any) {
  return {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
  };
}

export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}