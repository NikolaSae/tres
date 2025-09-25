// /app/api/humanitarian-renewals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { updateHumanitarianRenewalSchema } from "@/schemas/humanitarian-renewal";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautorizovan pristup" }, { status: 401 });
    }

    const renewal = await db.humanitarianContractRenewal.findUnique({
      where: { id: params.id },
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
      }
    });

    if (!renewal) {
      return NextResponse.json({ error: "Obnova nije pronađena" }, { status: 404 });
    }

    return NextResponse.json(renewal);

  } catch (error) {
    console.error("Greška pri dohvatanju obnove:", error);
    return NextResponse.json(
      { error: "Došlo je do greške pri dohvatanju podataka" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautorizovan pristup" }, { status: 401 });
    }

    const body = await request.json();
    const validatedFields = updateHumanitarianRenewalSchema.safeParse({
      ...body,
      id: params.id
    });

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Neispravni podaci", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { id, contractId, humanitarianOrgId, ...data } = validatedFields.data;

    // Proveri postojanje obnove
    const existingRenewal = await db.humanitarianContractRenewal.findUnique({
      where: { id },
      include: {
        contract: true,
        humanitarianOrg: true
      }
    });

    if (!existingRenewal) {
      return NextResponse.json({ error: "Obnova nije pronađena" }, { status: 404 });
    }

    const previousStatus = existingRenewal.subStatus;
    const statusChanged = previousStatus !== data.subStatus;

    const updatedRenewal = await db.humanitarianContractRenewal.update({
      where: { id },
      data: {
        proposedStartDate: new Date(data.proposedStartDate),
        proposedEndDate: new Date(data.proposedEndDate),
        proposedRevenue: data.proposedRevenue,
        subStatus: data.subStatus,
        documentsReceived: data.documentsReceived,
        legalApproved: data.legalApproved,
        financialApproved: data.financialApproved,
        signatureReceived: data.signatureReceived,
        notes: data.notes,
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
        },
        lastModifiedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log aktivnost
    let activityDetails = `Ažurirana obnova ugovora ${existingRenewal.contract.contractNumber}`;
    if (statusChanged) {
      activityDetails += ` - status promenjen sa ${previousStatus} na ${data.subStatus}`;
    }

    await db.activityLog.create({
      data: {
        action: "UPDATE_HUMANITARIAN_RENEWAL",
        entityType: "humanitarian_renewal",
        entityId: id,
        details: activityDetails,
        userId: session.user.id,
      }
    });

    return NextResponse.json(updatedRenewal);

  } catch (error) {
    console.error("Greška pri ažuriranju obnove:", error);
    return NextResponse.json(
      { error: "Došlo je do greške pri ažuriranju obnove" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautorizovan pristup" }, { status: 401 });
    }

    // Proveri dozvole
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Nemate dozvolu za brisanje obnova" },
        { status: 403 }
      );
    }

    const renewal = await db.humanitarianContractRenewal.findUnique({
      where: { id: params.id },
      include: {
        contract: true,
        humanitarianOrg: true
      }
    });

    if (!renewal) {
      return NextResponse.json({ error: "Obnova nije pronađena" }, { status: 404 });
    }

    if (renewal.subStatus === "FINAL_PROCESSING") {
      return NextResponse.json(
        { error: "Ne može se obrisati obnova koja je u završnoj fazi" },
        { status: 400 }
      );
    }

    await db.humanitarianContractRenewal.delete({
      where: { id: params.id }
    });

    // Log aktivnost
    await db.activityLog.create({
      data: {
        action: "DELETE_HUMANITARIAN_RENEWAL",
        entityType: "humanitarian_renewal",
        entityId: params.id,
        details: `Obrisana obnova ugovora ${renewal.contract.contractNumber} za ${renewal.humanitarianOrg.name}`,
        userId: session.user.id,
        severity: "WARNING"
      }
    });

    return NextResponse.json({ message: "Obnova je uspešno obrisana" });

  } catch (error) {
    console.error("Greška pri brisanju obnove:", error);
    return NextResponse.json(
      { error: "Došlo je do greške pri brisanju obnove" },
      { status: 500 }
    );
  }
}