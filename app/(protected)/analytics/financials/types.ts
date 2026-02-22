//// app/(protected)/analytics/financials/types.tsx
export type FinancialMetrics = {
  totalRevenue: number;
  outstandingAmount: number;
  collectedAmount: number;
  canceledAmount: number;
  revenueByMonth: {
    month: string;
    revenue: number;
    collected: number;
    outstanding: number;
  }[];
  serviceTypeBreakdown: {
    serviceType: string;
    revenue: number;
    percentage: number;
  }[];
  providerBreakdown: {
    providerName: string;
    revenue: number;
    percentage: number;
  }[];
};

export type ParkingFinancialMetrics = {
  totalAmount: number;
  totalQuantity: number;
  averagePrice: number;
  revenueByMonth: { month: string; amount: number; quantity: number }[];
  parkingServiceBreakdown: { serviceName: string; amount: number; percentage: number }[];
  groupBreakdown: { group: string; amount: number; percentage: number }[];
};

export type HumanitarianFinancialMetrics = {
  totalAmount: number;
  totalTransactions: number;
  prepaidAmount: number;
  postpaidAmount: number;
  revenueByMonth: { month: string; amount: number; prepaid: number; postpaid: number }[];
  orgBreakdown: {
    orgName: string;
    amount: number;
    percentage: number;
    prepaid: number;
    postpaid: number;
  }[];
  billingTypeBreakdown: { type: string; amount: number; percentage: number }[];
};