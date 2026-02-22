///app/api/analytics/sales/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

// Tipovi za grupisane podatke
interface MonthlySalesEntry {
  month: string;
  transactions: number;
  revenue: number;
  collectedAmount: number;
  uncollectedAmount: number;
}

interface ProviderSalesEntry {
  providerId: string;
  providerName: string;
  transactions: number;
  revenue: number;
  collectedAmount: number;
  uncollectedAmount: number;
  products: Record<string, { transactions: number; revenue: number }>;
}

interface ServiceSalesEntry {
  serviceId: string;
  serviceName: string;
  transactions: number;
  revenue: number;
  collectedAmount: number;
  uncollectedAmount: number;
}

interface ProductSalesEntry {
  product: string;
  transactions: number;
  revenue: number;
  collectedAmount: number;
  uncollectedAmount: number;
}

type GroupedEntry =
  | MonthlySalesEntry
  | ProviderSalesEntry
  | ServiceSalesEntry
  | ProductSalesEntry;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const providerId = searchParams.get("providerId");
    const serviceId = searchParams.get("serviceId");

    const where: Prisma.VasServiceWhereInput = {};

    if (startDate && endDate) {
      where.mesec_pruzanja_usluge = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (providerId) where.provajderId = providerId;
    if (serviceId) where.serviceId = serviceId;

    const vasServiceSales = await db.vasService.findMany({
      where,
      include: { service: true, provider: true },
      orderBy: { mesec_pruzanja_usluge: "asc" },
    });

    const monthlySales = vasServiceSales.reduce(
      (acc, sale) => {
        const month = sale.mesec_pruzanja_usluge.toISOString().slice(0, 7);
        if (!acc[month]) {
          acc[month] = { month, transactions: 0, revenue: 0, collectedAmount: 0, uncollectedAmount: 0 };
        }
        acc[month].transactions += sale.broj_transakcija;
        acc[month].revenue += sale.fakturisan_iznos;
        acc[month].collectedAmount += sale.naplacen_iznos;
        acc[month].uncollectedAmount += sale.nenaplacen_iznos;
        return acc;
      },
      {} as Record<string, MonthlySalesEntry>
    );

    const salesData = Object.values(monthlySales).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    const totalRevenue = vasServiceSales.reduce((sum, s) => sum + s.fakturisan_iznos, 0);
    const totalCollected = vasServiceSales.reduce((sum, s) => sum + s.naplacen_iznos, 0);

    const totalStats = {
      totalTransactions: vasServiceSales.reduce((sum, s) => sum + s.broj_transakcija, 0),
      totalRevenue,
      totalCollected,
      totalUncollected: vasServiceSales.reduce((sum, s) => sum + s.nenaplacen_iznos, 0),
      collectionRate: totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0,
    };

    return NextResponse.json({ salesData, totalStats });
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales analytics" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const data = await request.json();
    const { startDate, endDate, providerId, serviceId, groupBy, includeProductDetails } = data;

    const where: Prisma.VasServiceWhereInput = {};

    if (startDate && endDate) {
      where.mesec_pruzanja_usluge = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (providerId) where.provajderId = providerId;
    if (serviceId) where.serviceId = serviceId;

    const vasServiceSales = await db.vasService.findMany({
      where,
      include: { service: true, provider: true },
    });

    let groupedData: Record<string, GroupedEntry> = {};

    switch (groupBy) {
      case "provider":
        groupedData = vasServiceSales.reduce(
          (acc, sale) => {
            const pid = sale.provider.id;
            if (!acc[pid]) {
              acc[pid] = {
                providerId: pid,
                providerName: sale.provider.name,
                transactions: 0,
                revenue: 0,
                collectedAmount: 0,
                uncollectedAmount: 0,
                products: {},
              } as ProviderSalesEntry;
            }
            const entry = acc[pid] as ProviderSalesEntry;
            entry.transactions += sale.broj_transakcija;
            entry.revenue += sale.fakturisan_iznos;
            entry.collectedAmount += sale.naplacen_iznos;
            entry.uncollectedAmount += sale.nenaplacen_iznos;

            if (includeProductDetails) {
              const product = sale.proizvod;
              if (!entry.products[product]) {
                entry.products[product] = { transactions: 0, revenue: 0 };
              }
              entry.products[product].transactions += sale.broj_transakcija;
              entry.products[product].revenue += sale.fakturisan_iznos;
            }
            return acc;
          },
          {} as Record<string, GroupedEntry>
        );
        break;

      case "service":
        groupedData = vasServiceSales.reduce(
          (acc, sale) => {
            const sid = sale.service.id;
            if (!acc[sid]) {
              acc[sid] = {
                serviceId: sid,
                serviceName: sale.service.name,
                transactions: 0,
                revenue: 0,
                collectedAmount: 0,
                uncollectedAmount: 0,
              } as ServiceSalesEntry;
            }
            const entry = acc[sid] as ServiceSalesEntry;
            entry.transactions += sale.broj_transakcija;
            entry.revenue += sale.fakturisan_iznos;
            entry.collectedAmount += sale.naplacen_iznos;
            entry.uncollectedAmount += sale.nenaplacen_iznos;
            return acc;
          },
          {} as Record<string, GroupedEntry>
        );
        break;

      case "product":
        groupedData = vasServiceSales.reduce(
          (acc, sale) => {
            const product = sale.proizvod;
            if (!acc[product]) {
              acc[product] = {
                product,
                transactions: 0,
                revenue: 0,
                collectedAmount: 0,
                uncollectedAmount: 0,
              } as ProductSalesEntry;
            }
            const entry = acc[product] as ProductSalesEntry;
            entry.transactions += sale.broj_transakcija;
            entry.revenue += sale.fakturisan_iznos;
            entry.collectedAmount += sale.naplacen_iznos;
            entry.uncollectedAmount += sale.nenaplacen_iznos;
            return acc;
          },
          {} as Record<string, GroupedEntry>
        );
        break;

      default:
        groupedData = vasServiceSales.reduce(
          (acc, sale) => {
            const month = sale.mesec_pruzanja_usluge.toISOString().slice(0, 7);
            if (!acc[month]) {
              acc[month] = { month, transactions: 0, revenue: 0, collectedAmount: 0, uncollectedAmount: 0 } as MonthlySalesEntry;
            }
            const entry = acc[month] as MonthlySalesEntry;
            entry.transactions += sale.broj_transakcija;
            entry.revenue += sale.fakturisan_iznos;
            entry.collectedAmount += sale.naplacen_iznos;
            entry.uncollectedAmount += sale.nenaplacen_iznos;
            return acc;
          },
          {} as Record<string, GroupedEntry>
        );
    }

    const totalStats = {
      totalTransactions: vasServiceSales.reduce((sum, s) => sum + s.broj_transakcija, 0),
      totalRevenue: vasServiceSales.reduce((sum, s) => sum + s.fakturisan_iznos, 0),
      totalCollected: vasServiceSales.reduce((sum, s) => sum + s.naplacen_iznos, 0),
      totalUncollected: vasServiceSales.reduce((sum, s) => sum + s.nenaplacen_iznos, 0),
    };

    return NextResponse.json({
      salesData: Object.values(groupedData),
      totalStats,
      groupBy: groupBy || "month",
    });
  } catch (error) {
    console.error("Error processing sales analytics:", error);
    return NextResponse.json(
      { error: "Failed to process sales analytics" },
      { status: 500 }
    );
  }
}