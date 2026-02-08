// /app/api/contracts/[id]/services/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { addContractService } from '@/actions/contracts/add-service';

// Handler za GET za dohvatanje servisa povezanih sa ugovorom
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Dohvatanje svih ServiceContract zapisa za dati contractId
    const serviceLinks = await db.serviceContract.findMany({
      where: { contractId: id },
      include: {
          service: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Vraćanje liste povezanih servisa
    return NextResponse.json(serviceLinks, { status: 200 });

  } catch (error) {
    console.error(`Error fetching services for contract ${id}:`, error);
    return NextResponse.json({ error: "Failed to fetch services." }, { status: 500 });
  }
}

// Handler za POST za dodavanje novog servisa ugovoru
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id: contractId } = await params;

    try {
        const values = await request.json();
        const valuesWithContractId = { ...values, contractId };

        // Pozivanje Server Akcije za dodavanje servisa
        const result = await addContractService(valuesWithContractId);

        if (result.error) {
             if (result.error.includes("Contract not found") || result.error.includes("Service not found")) {
                 return NextResponse.json({ error: result.error }, { status: 404 });
             }
             if (result.error.includes("Service is already linked") || result.error.includes("Invalid input fields")) {
                 return NextResponse.json({ error: result.error }, { status: 400 });
             }
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: result.success, serviceContract: result.serviceContract }, { status: 201 });

    } catch (error) {
        console.error(`Error adding service to contract ${contractId} via API:`, error);
        return NextResponse.json({ error: "Failed to link service to contract." }, { status: 500 });
    }
}