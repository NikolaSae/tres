// /actions/humanitarian-renewals/list.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { renewalFiltersSchema } from "@/schemas/humanitarian-renewal";
import { RenewalStatistics, HumanitarianRenewalsList } from "@/lib/types/humanitarian-renewal-types";

export async function getHumanitarianRenewals(filters: any = {}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Neautorizovan pristup" };
    }

    const validatedFilters = renewalFiltersSchema.safeParse(filters);
    if (!validatedFilters.success) {
      return { error: "Neispravni filteri" };
    }

    const { status, organizationId, contractId, dateFrom, dateTo, page, limit } = validatedFilters.data;

    // Kreiraj where uslov
    const where: any = {};

    if (status) {
      where.subStatus = status;
    }

    if (organizationId) {
      where.humanitarianOrgId = organizationId;
    }

    if (contractId) {
      where.contractId = contractId;
    }

    if (dateFrom || dateTo) {
      where.renewalStartDate = {};
      if (dateFrom) {
        where.renewalStartDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.renewalStartDate.lte = new Date(dateTo);
      }
    }

    // Dobij ukupan broj
    const total = await db.humanitarianContractRenewal.count({ where });

    // Dobij obnove sa paginacijom
    const renewals = await db.humanitarianContractRenewal.findMany({
      where,
      include: {
        contract: {
          include: {
            humanitarianOrg: true
          }
        },
        humanitarianOrg: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        lastModifiedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    const result: HumanitarianRenewalsList = {
      renewals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };

    return { success: true, data: result };

  } catch (error) {
    console.error("Greška pri dohvatanju obnova:", error);
    return { error: "Došlo je do greške pri dohvatanju podataka" };
  }
}

export async function getRenewalStatistics() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Neautorizovan pristup" };
    }

    // Ukupan broj obnova
    const totalRenewals = await db.humanitarianContractRenewal.count();

    // Obnove u toku (nisu u završnom procesiranju)
    const inProgress = await db.humanitarianContractRenewal.count({
      where: {
        subStatus: {
          not: "FINAL_PROCESSING"
        }
      }
    });

    // Obnove koje čekaju potpis
    const awaitingSignature = await db.humanitarianContractRenewal.count({
      where: {
        subStatus: "AWAITING_SIGNATURE"
      }
    });

    // Završene obnove
    const completed = await db.humanitarianContractRenewal.count({
      where: {
        subStatus: "FINAL_PROCESSING"
      }
    });

    // Obnove po statusu
    const renewalsByStatus = await db.humanitarianContractRenewal.groupBy({
      by: ['subStatus'],
      _count: {
        subStatus: true
      }
    });

    // Obnove po mesecima (poslednih 6 meseci)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRenewals = await db.humanitarianContractRenewal.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        createdAt: true
      }
    });

    // Grupiši po mesecima
    const monthlyGrouped = monthlyRenewals.reduce((acc, renewal) => {
      const month = renewal.createdAt.toISOString().slice(0, 7); // YYYY-MM format
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const monthlyData = Object.entries(monthlyGrouped).map(([month, count]) => ({
      month,
      count
    }));

    // Prosečan napredak
    const allRenewals = await db.humanitarianContractRenewal.findMany({
      select: {
        documentsReceived: true,
        legalApproved: true,
        financialApproved: true,
        signatureReceived: true
      }
    });

    const totalProgress = allRenewals.reduce((sum, renewal) => {
      const steps = [
        renewal.documentsReceived,
        renewal.legalApproved,
        renewal.financialApproved,
        renewal.signatureReceived
      ];
      const completedSteps = steps.filter(Boolean).length;
      return sum + (completedSteps / steps.length) * 100;
    }, 0);

    const averageProgress = allRenewals.length > 0 ? totalProgress / allRenewals.length : 0;

    const statistics: RenewalStatistics = {
      totalRenewals,
      inProgress,
      awaitingSignature,
      completed,
      averageProgress: Math.round(averageProgress),
      renewalsByStatus: renewalsByStatus.map(item => ({
        status: item.subStatus,
        count: item._count.subStatus,
        label: getStatusLabel(item.subStatus)
      })),
      monthlyRenewals: monthlyData
    };

    return { success: true, data: statistics };

  } catch (error) {
    console.error("Greška pri dohvatanju statistika:", error);
    return { error: "Došlo je do greške pri dohvatanju statistika" };
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    "DOCUMENT_COLLECTION": "Prikupljanje dokumenata",
    "LEGAL_REVIEW": "Pravni pregled",
    "FINANCIAL_APPROVAL": "Finansijska potvrda",
    "AWAITING_SIGNATURE": "Čeka potpis",
    "FINAL_PROCESSING": "Završno procesiranje"
  };
  return labels[status] || status;
}