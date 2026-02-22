// actions/humanitarian-orgs/get-org-financial-stats.ts
"use server";

import { db } from "@/lib/db";
import { cacheTag, cacheLife } from "next/cache";

async function _getHumanitarianOrgFinancialData(orgId: string) {
  const [grouped, monthlyRaw, activeContracts] = await Promise.all([
    db.humanitarianTransaction.groupBy({
      by: ["billingType"],
      where: { humanitarianOrgId: orgId },
      _sum: { amount: true },
      _count: { id: true },
    }),
    db.humanitarianTransaction.findMany({
      where: { humanitarianOrgId: orgId },
      select: {
        date: true,
        amount: true,
        billingType: true,
        quantity: true,
      },
      orderBy: { date: "asc" },
    }),
    db.contract.count({
      where: { humanitarianOrgId: orgId, status: "ACTIVE" },
    }),
  ]);

  let totalRevenue = 0;
  let prepaidAmount = 0;
  let postpaidAmount = 0;

  for (const g of grouped) {
    const amount = g._sum.amount || 0;
    totalRevenue += amount;
    if (g.billingType === "PREPAID") prepaidAmount = amount;
    else postpaidAmount = amount;
  }

  const monthMap = new Map<string, {
    month_year: string;
    total_amount: number;
    prepaid_amount: number;
    postpaid_amount: number;
    total_quantity: number;
    transaction_count: number;
  }>();

  for (const t of monthlyRaw) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        month_year: key,
        total_amount: 0,
        prepaid_amount: 0,
        postpaid_amount: 0,
        total_quantity: 0,
        transaction_count: 0,
      });
    }
    const entry = monthMap.get(key)!;
    entry.total_amount += t.amount || 0;
    entry.total_quantity += t.quantity || 0;
    entry.transaction_count += 1;
    if (t.billingType === "PREPAID") {
      entry.prepaid_amount += t.amount || 0;
    } else {
      entry.postpaid_amount += t.amount || 0;
    }
  }

  const monthlyStats = Array.from(monthMap.values()).sort((a, b) =>
    a.month_year.localeCompare(b.month_year)
  );

  return {
    revenue: { totalRevenue, prepaidAmount, postpaidAmount },
    activeContracts,
    monthlyStats,
  };
}

export async function getHumanitarianOrgFinancialData(orgId: string) {
  "use cache";
  cacheTag(`humanitarian-org-${orgId}`);
  cacheLife("minutes");

  return _getHumanitarianOrgFinancialData(orgId);
}

export type HumanitarianOrgFinancialData = Awaited<ReturnType<typeof _getHumanitarianOrgFinancialData>>;