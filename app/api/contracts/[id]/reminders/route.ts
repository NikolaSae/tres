// /app/api/contracts/[id]/reminders/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { createContractReminder } from '@/actions/contracts/create-reminder';

// Handler za GET za dohvatanje podsetnika ugovora
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Dohvatanje svih podsetnika za dati contractId
    const reminders = await db.contractReminder.findMany({
      where: { contractId: id },
      orderBy: { reminderDate: 'asc' },
      include: {
          acknowledgedBy: {
              select: { id: true, name: true }
          }
      }
    });

    // Vraćanje liste podsetnika
    return NextResponse.json(reminders, { status: 200 });

  } catch (error) {
    console.error(`Error fetching reminders for contract ${id}:`, error);
    return NextResponse.json({ error: "Failed to fetch reminders." }, { status: 500 });
  }
}

// Handler za POST za kreiranje novog podsetnika za ugovor
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id: contractId } = await params;

    try {
        const values = await request.json();
        const valuesWithContractId = { ...values, contractId };

        // Pozivanje Server Akcije za kreiranje podsetnika
        const result = await createContractReminder(valuesWithContractId);

        if (result.error) {
             if (result.error.includes("Contract not found") || result.error.includes("Ugovor sa datim ID-om ne postoji")) {
                 return NextResponse.json({ error: result.error }, { status: 404 });
             }
             if (result.error.includes("Validacija neuspešna") || result.error.includes("Invalid input fields")) {
                  return NextResponse.json({ error: result.error, details: result.details }, { status: 400 });
             }
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: result.success, reminderId: result.reminderId }, { status: 201 });

    } catch (error) {
        console.error(`Error creating reminder for contract ${contractId} via API:`, error);
        return NextResponse.json({ error: "Failed to create reminder." }, { status: 500 });
    }
}