"use server";

import { db } from "@/lib/db";
import { ServiceType } from "@prisma/client";

type RevenueBreakdownData = {
  type: ServiceType;
  value: number;
}[];

export async function getRevenueBreakdown(): Promise<RevenueBreakdownData> {
  try {
    const vasRevenue = await db.vasService.groupBy({
      by: ['serviceId'],
      _sum: {
        fakturisan_iznos: true,
      },
    });

    const serviceIds = vasRevenue.map(item => item.serviceId);
    const services = await db.service.findMany({
      where: {
        id: {
          in: serviceIds,
        },
      },
      select: {
        id: true,
        type: true,
      },
    });

    const serviceTypeMap = new Map(
      services.map(s => [s.id, s.type])
    );

    const revenueByType = new Map<ServiceType, number>();

    vasRevenue.forEach(item => {
      const serviceType = serviceTypeMap.get(item.serviceId);
      if (serviceType) {
        const currentValue = revenueByType.get(serviceType) || 0;
        const revenue = item._sum.fakturisan_iznos || 0;
        revenueByType.set(serviceType, currentValue + revenue);
      }
    });

    const result: RevenueBreakdownData = Array.from(revenueByType.entries()).map(
      ([type, value]) => ({
        type,
        value,
      })
    );

    return result;
  } catch (error) {
    console.error("Error fetching revenue breakdown:", error);
    throw new Error("Failed to fetch revenue breakdown");
  }
}

export async function getRevenueBreakdownByPeriod(
  startDate: Date,
  endDate: Date
): Promise<RevenueBreakdownData> {
  try {
    const vasRevenue = await db.vasService.groupBy({
      by: ['serviceId'],
      where: {
        mesec_pruzanja_usluge: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        fakturisan_iznos: true,
      },
    });

    const serviceIds = vasRevenue.map(item => item.serviceId);
    const services = await db.service.findMany({
      where: {
        id: {
          in: serviceIds,
        },
      },
      select: {
        id: true,
        type: true,
      },
    });

    const serviceTypeMap = new Map(
      services.map(s => [s.id, s.type])
    );

    const revenueByType = new Map<ServiceType, number>();

    vasRevenue.forEach(item => {
      const serviceType = serviceTypeMap.get(item.serviceId);
      if (serviceType) {
        const currentValue = revenueByType.get(serviceType) || 0;
        const revenue = item._sum.fakturisan_iznos || 0;
        revenueByType.set(serviceType, currentValue + revenue);
      }
    });

    const result: RevenueBreakdownData = Array.from(revenueByType.entries()).map(
      ([type, value]) => ({
        type,
        value,
      })
    );

    return result;
  } catch (error) {
    console.error("Error fetching revenue breakdown by period:", error);
    throw new Error("Failed to fetch revenue breakdown");
  }
}

export async function getTotalRevenue(): Promise<number> {
  try {
    const result = await db.vasService.aggregate({
      _sum: {
        fakturisan_iznos: true,
      },
    });

    return result._sum.fakturisan_iznos || 0;
  } catch (error) {
    console.error("Error fetching total revenue:", error);
    throw new Error("Failed to fetch total revenue");
  }
}

export async function getRevenueByProvider(): Promise<Array<{ providerId: string; providerName: string; revenue: number }>> {
  try {
    const revenueData = await db.vasService.groupBy({
      by: ['provajderId'],
      _sum: {
        fakturisan_iznos: true,
      },
    });

    const providerIds = revenueData.map(item => item.provajderId);
    const providers = await db.provider.findMany({
      where: {
        id: {
          in: providerIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const providerMap = new Map(
      providers.map(p => [p.id, p.name])
    );

    return revenueData.map(item => ({
      providerId: item.provajderId,
      providerName: providerMap.get(item.provajderId) || 'Unknown',
      revenue: item._sum.fakturisan_iznos || 0,
    }));
  } catch (error) {
    console.error("Error fetching revenue by provider:", error);
    throw new Error("Failed to fetch revenue by provider");
  }
}