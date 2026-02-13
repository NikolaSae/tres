// /app/api/contracts/[id]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { updateContract } from '@/actions/contracts/update';
import { deleteContract } from '@/actions/contracts/delete';

// Handler za GET za dohvatanje pojedinačnog ugovora po ID-u
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Osnovna validacija ID-a
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid contract ID format.' }, { status: 400 });
  }

  try {
    // Dohvatanje ugovora sa svim relevantnim relacijama za prikaz detalja
    const contract = await db.contract.findUnique({
      where: { id },
      include: {
        provider: { select: { id: true, name: true } },
        humanitarianOrg: { select: { id: true, name: true } },
        parkingService: { select: { id: true, name: true } },
        services: {
          include: { service: true }
        },
        attachments: { orderBy: { uploadedAt: 'asc' } },
        reminders: { orderBy: { reminderDate: 'asc' } },
        humanitarianRenewals: { orderBy: { createdAt: 'desc' } },
        createdBy: { select: { id: true, name: true } },
        lastModifiedBy: { select: { id: true, name: true } },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found." }, { status: 404 });
    }

    return NextResponse.json(contract, { status: 200 });

  } catch (error) {
    console.error(`Error fetching contract with ID ${id}:`, error);
    return NextResponse.json({ error: "Failed to fetch contract." }, { status: 500 });
  }
}

// Handler za PUT za ažuriranje ugovora po ID-u
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const values = await request.json();

    // Pozivanje Server Akcije za ažuriranje ugovora
    const result = await updateContract(id, values);

    if (!result.success) {
      if (result.error === "Contract not found.") {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      // Check if details exists in the result before accessing it
      if ('details' in result && result.details) {
        return NextResponse.json({ error: result.error, details: result.details }, { status: 400 });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Use contractId instead of id
    return NextResponse.json({ 
      success: result.message, 
      contractId: result.contractId 
    }, { status: 200 });

  } catch (error) {
    console.error(`Error updating contract with ID ${id} via API:`, error);
    return NextResponse.json({ error: "Failed to update contract." }, { status: 500 });
  }
}

// Handler za DELETE za brisanje ugovora po ID-u
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Pozivanje Server Akcije za brisanje ugovora
    const result = await deleteContract(id);

    if (result.error) {
      if (result.error === "Contract not found.") {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: result.success }, { status: 200 });

  } catch (error) {
    console.error(`Error deleting contract with ID ${id} via API:`, error);
    return NextResponse.json({ error: "Failed to delete contract." }, { status: 500 });
  }
}