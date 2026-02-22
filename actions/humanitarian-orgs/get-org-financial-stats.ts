//actions/humanitarian-orgs/get-org-financial-stats.ts

"use server";

import { db } from "@/lib/db";

export async function getHumanitarianOrgRevenue(orgId: string) {
  try {
    const [total, prepaid, postpaid] = await Promise.all([
      db.humanitarianTransaction.aggregate({
        where: { humanitarianOrgId: orgId },
        _sum: { amount: true },
      }),
      db.humanitarianTransaction.aggregate({
        where: { humanitarianOrgId: orgId, billingType: "PREPAID" },
        _sum: { amount: true },
      }),
      db.humanitarianTransaction.aggregate({
        where: { humanitarianOrgId: orgId, billingType: "POSTPAID" },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalRevenue: total._sum.amount || 0,
      prepaidAmount: prepaid._sum.amount || 0,
      postpaidAmount: postpaid._sum.amount || 0,
    };
  } catch (error) {
    console.error("Error fetching humanitarian org revenue:", error);
    return { totalRevenue: 0, prepaidAmount: 0, postpaidAmount: 0 };
  }
}

export async function getHumanitarianOrgActiveContracts(orgId: string): Promise<number> {
  try {
    return await db.contract.count({
      where: { humanitarianOrgId: orgId, status: "ACTIVE" },
    });
  } catch (error) {
    console.error("Error fetching active contracts count:", error);
    return 0;
  }
}

export async function getHumanitarianOrgMonthlyStats(orgId: string) {
  try {
    const transactions = await db.humanitarianTransaction.findMany({
      where: { humanitarianOrgId: orgId },
      select: {
        date: true,
        amount: true,
        billingType: true,
        quantity: true,
      },
      orderBy: { date: "asc" },
    });

    const monthMap = new Map<string, {
      month_year: string;
      total_amount: number;
      prepaid_amount: number;
      postpaid_amount: number;
      total_quantity: number;
      transaction_count: number;
    }>();

    for (const t of transactions) {
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

    return Array.from(monthMap.values()).sort((a, b) =>
      a.month_year.localeCompare(b.month_year)
    );
  } catch (error) {
    console.error("Error fetching humanitarian monthly stats:", error);
    return [];
  }
}