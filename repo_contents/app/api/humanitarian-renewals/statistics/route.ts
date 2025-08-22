// /app/api/humanitarian-renewals/statistics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautorizovan pristup" }, { status: 401 });
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

    // Mapiranje statusa na labele
    const statusLabels: Record<string, string> = {
      "DOCUMENT_COLLECTION": "Prikupljanje dokumenata",
      "LEGAL_REVIEW": "Pravni pregled",
      "FINANCIAL_APPROVAL": "Finansijska potvrda",
      "AWAITING_SIGNATURE": "Čeka potpis",
      "FINAL_PROCESSING": "Završno procesiranje"
    };

    const statusData = renewalsByStatus.map(item => ({
      status: item.subStatus,
      count: item._count.subStatus,
      label: statusLabels[item.subStatus] || item.subStatus
    }));

    // Obnove po mesecima (poslednih 12 meseci)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRenewals = await db.humanitarianContractRenewal.findMany({
      where: {
        createdAt: {
          gte: twelveMonthsAgo
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

    const monthlyData = Object.entries(monthlyGrouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month,
        count,
        label: new Date(month + '-01').toLocaleDateString('sr-RS', { 
          year: 'numeric', 
          month: 'long' 
        })
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

    // Obnove koje treba da isteknu uskoro (u narednih 30 dana)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringContracts = await db.humanitarianContractRenewal.count({
      where: {
        contract: {
          endDate: {
            lte: thirtyDaysFromNow
          }
        },
        subStatus: {
          not: "FINAL_PROCESSING"
        }
      }
    });

    // Top 5 organizacija po broju obnova
    const topOrganizations = await db.humanitarianContractRenewal.groupBy({
      by: ['humanitarianOrgId'],
      _count: {
        humanitarianOrgId: true
      },
      orderBy: {
        _count: {
          humanitarianOrgId: 'desc'
        }
      },
      take: 5
    });

    // Dobij imena organizacija
    const orgIds = topOrganizations.map(org => org.humanitarianOrgId);
    const organizations = await db.humanitarianOrg.findMany({
      where: {
        id: {
          in: orgIds
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    const topOrgsWithNames = topOrganizations.map(org => {
      const orgData = organizations.find(o => o.id === org.humanitarianOrgId);
      return {
        organizationId: org.humanitarianOrgId,
        organizationName: orgData?.name || 'Nepoznato',
        renewalCount: org._count.humanitarianOrgId
      };
    });

    const statistics = {
      totalRenewals,
      inProgress,
      awaitingSignature,
      completed,
      expiringContracts,
      averageProgress: Math.round(averageProgress),
      renewalsByStatus: statusData,
      monthlyRenewals: monthlyData,
      topOrganizations: topOrgsWithNames
    };

    return NextResponse.json(statistics);

  } catch (error) {
    console.error("Greška pri dohvatanju statistika:", error);
    return NextResponse.json(
      { error: "Došlo je do greške pri dohvatanju statistika" },
      { status: 500 }
    );
  }
}