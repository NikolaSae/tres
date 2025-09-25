// /app/api/humanitarian-renewals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { renewalFiltersSchema, createHumanitarianRenewalSchema } from "@/schemas/humanitarian-renewal";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautorizovan pristup" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = Object.fromEntries(searchParams.entries());
    
    // Konvertuj string parametre u odgovarajuće tipove
    if (filters.page) filters.page = parseInt(filters.page);
    if (filters.limit) filters.limit = parseInt(filters.limit);

    const validatedFilters = renewalFiltersSchema.safeParse(filters);
    if (!validatedFilters.success) {
      return NextResponse.json(
        { error: "Neispravni parametri", details: validatedFilters.error.flatten() },
        { status: 400 }
      );
    }

    const { status, organizationId, contractId, dateFrom, dateTo, page, limit } = validatedFilters.data;

    // Kreiraj where uslov
    const where: any = {};

    if (status) where.subStatus = status;
    if (organizationId) where.humanitarianOrgId = organizationId;
    if (contractId) where.contractId = contractId;

    if (dateFrom || dateTo) {
      where.renewalStartDate = {};
      if (dateFrom) where.renewalStartDate.gte = new Date(dateFrom);
      if (dateTo) where.renewalStartDate.lte = new Date(dateTo);
    }

    const total = await db.humanitarianContractRenewal.count({ where });

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

    return NextResponse.json({
      renewals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error("Greška pri dohvatanju obnova:", error);
    return NextResponse.json(
      { error: "Došlo je do greške pri dohvatanju podataka" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautorizovan pristup" }, { status: 401 });
    }

    const body = await request.json();
    const validatedFields = createHumanitarianRenewalSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Neispravni podaci", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { contractId, humanitarianOrgId, ...data } = validatedFields.data;

    // Proveri da li ugovor postoji
    const contract = await db.contract.findFirst({
      where: {
        id: contractId,
        humanitarianOrgId: humanitarianOrgId,
        type: "HUMANITARIAN"
      }
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Ugovor nije pronađen ili ne pripada ovoj organizaciji" },
        { status: 404 }
      );
    }

    // Proveri postojanje aktivne obnove
    const existingRenewal = await db.humanitarianContractRenewal.findFirst({
      where: {
        contractId: contractId,
        subStatus: { not: "FINAL_PROCESSING" }
      }
    });

    if (existingRenewal) {
      return NextResponse.json(
        { error: "Već postoji aktivna obnova za ovaj ugovor" },
        { status: 409 }
      );
    }

    const renewal = await db.humanitarianContractRenewal.create({
      data: {
        contractId,
        humanitarianOrgId,
        proposedStartDate: new Date(data.proposedStartDate),
        proposedEndDate: new Date(data.proposedEndDate),
        proposedRevenue: data.proposedRevenue,
        subStatus: data.subStatus,
        documentsReceived: data.documentsReceived,
        legalApproved: data.legalApproved,
        financialApproved: data.financialApproved,
        signatureReceived: data.signatureReceived,
        notes: data.notes,
        createdById: session.user.id,
        lastModifiedById: session.user.id,
      },
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
        }
      }
    });

    // Log aktivnost
    await db.activityLog.create({
      data: {
        action: "CREATE_HUMANITARIAN_RENEWAL",
        entityType: "humanitarian_renewal",
        entityId: renewal.id,
        details: `Kreirana obnova ugovora ${contract.contractNumber}`,
        userId: session.user.id,
      }
    });

    return NextResponse.json(renewal, { status: 201 });

  } catch (error) {
    console.error("Greška pri kreiranju obnove:", error);
    return NextResponse.json(
      { error: "Došlo je do greške pri kreiranju obnove" },
      { status: 500 }
    );
  }
}