// app/api/contracts/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Filter parameters (same as main contracts route)
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const expiringWithin = searchParams.get("expiringWithin");
    const includeExpired = searchParams.get("includeExpired") === "true";

    // Build where clause
    const where: Prisma.ContractWhereInput = {};

    if (status && status !== "all") {
      where.status = status as any;
    }

    if (type && type !== "all") {
      where.type = type as any;
    }

    if (search) {
      where.OR = [
        { organizationName: { contains: search, mode: "insensitive" } },
        { contractNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (expiringWithin) {
      const days = parseInt(expiringWithin);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      if (includeExpired) {
        where.endDate = { lte: futureDate };
      } else {
        where.endDate = {
          gte: new Date(),
          lte: futureDate
        };
      }
    }

    // Fetch all contracts (no pagination for export)
    const contracts = await db.contract.findMany({
      where,
      orderBy: [
        { endDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Type labels
    const typeLabels = {
      'HUMANITARIAN_AID': 'Humanitarna pomoć',
      'SERVICE_PROVIDER': 'Pružalac usluga',
      'PARKING_SERVICE': 'Parking servis'
    };

    // Status labels
    const statusLabels = {
      'ACTIVE': 'Aktivan',
      'EXPIRED': 'Istekao',
      'EXPIRING_SOON': 'Uskoro ističe',
      'RENEWAL_IN_PROGRESS': 'Obnova u toku',
      'PENDING': 'Na čekanju',
      'TERMINATED': 'Prekinut',
      'DRAFT': 'Nacrt'
    };

    // Create CSV content
    const headers = [
      'Broj ugovora',
      'Organizacija',
      'Tip ugovora',
      'Status',
      'Datum početka',
      'Datum kraja',
      'Vrednost',
      'Opis',
      'Napomena o obnovi',
      'Dana do isteka'
    ];

    const csvRows = contracts.map(contract => {
      const now = new Date();
      const endDate = new Date(contract.endDate);
      const daysToExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return [
        contract.contractNumber || '',
        contract.organizationName || '',
        typeLabels[contract.type as keyof typeof typeLabels] || contract.type,
        statusLabels[contract.status as keyof typeof statusLabels] || contract.status,
        contract.startDate ? new Date(contract.startDate).toLocaleDateString('sr-RS') : '',
        contract.endDate ? new Date(contract.endDate).toLocaleDateString('sr-RS') : '',
        contract.value ? contract.value.toString() : '',
        contract.description || '',
        contract.renewalClause || '',
        daysToExpiry.toString()
      ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Add BOM for proper UTF-8 encoding in Excel
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    // Return CSV response
    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ugovori-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error("Error exporting contracts:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}