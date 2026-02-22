// app/api/contracts/export/route.ts
import { connection } from 'next/server';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  await connection();

  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const expiringWithin = searchParams.get("expiringWithin");
    const includeExpired = searchParams.get("includeExpired") === "true";

    const where: Prisma.ContractWhereInput = {};

    if (status && status !== "all") where.status = status as any;
    if (type && type !== "all") where.type = type as any;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contractNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (expiringWithin) {
      const days = parseInt(expiringWithin);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      where.endDate = includeExpired
        ? { lte: futureDate }
        : { gte: new Date(), lte: futureDate };
    }

    const contracts = await db.contract.findMany({
      where,
      include: {
        provider: { select: { name: true } },
        humanitarianOrg: { select: { name: true } },
        parkingService: { select: { name: true } },
      },
      orderBy: [{ endDate: 'asc' }, { createdAt: 'desc' }]
    });

    const typeLabels: Record<string, string> = {
      'HUMANITARIAN': 'Humanitarna pomoć',
      'PROVIDER': 'Pružalac usluga',
      'PARKING': 'Parking servis',
      'BULK': 'Bulk servis'
    };

    const statusLabels: Record<string, string> = {
      'ACTIVE': 'Aktivan',
      'EXPIRED': 'Istekao',
      'PENDING': 'Na čekanju',
      'RENEWAL_IN_PROGRESS': 'Obnova u toku',
      'TERMINATED': 'Prekinut',
      'DRAFT': 'Nacrt'
    };

    const headers = [
      'Broj ugovora', 'Naziv', 'Organizacija', 'Tip ugovora',
      'Status', 'Datum početka', 'Datum kraja', 'Procenat prihoda',
      'Opis', 'Dana do isteka'
    ];

    const now = new Date();

    const csvRows = contracts.map(contract => {
      const daysToExpiry = Math.ceil(
        (new Date(contract.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      let organizationName = '';
      if (contract.type === 'HUMANITARIAN') organizationName = contract.humanitarianOrg?.name || '';
      else if (contract.type === 'PROVIDER') organizationName = contract.provider?.name || '';
      else if (contract.type === 'PARKING') organizationName = contract.parkingService?.name || '';

      return [
        contract.contractNumber || '',
        contract.name || '',
        organizationName,
        typeLabels[contract.type] || contract.type,
        statusLabels[contract.status] || contract.status,
        contract.startDate ? new Date(contract.startDate).toLocaleDateString('sr-RS') : '',
        contract.endDate ? new Date(contract.endDate).toLocaleDateString('sr-RS') : '',
        contract.revenuePercentage?.toString() || '',
        contract.description || '',
        daysToExpiry.toString()
      ];
    });

    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return new NextResponse('\uFEFF' + csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ugovori-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error("Error exporting contracts:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}