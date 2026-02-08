// /app/api/contracts/[id]/attachments/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { addContractAttachment } from '@/actions/contracts/add-attachment';

// Handler za GET za dohvatanje priloga ugovora
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Dohvatanje svih priloga za dati contractId
    const attachments = await db.contractAttachment.findMany({
      where: { contractId: id },
      orderBy: { uploadedAt: 'asc' },
      include: {
          uploadedBy: {
              select: { id: true, name: true }
          }
      }
    });

    // Vraćanje liste priloga
    return NextResponse.json(attachments, { status: 200 });

  } catch (error) {
    console.error(`Error fetching attachments for contract ${id}:`, error);
    return NextResponse.json({ error: "Failed to fetch attachments." }, { status: 500 });
  }
}

// Handler za POST za dodavanje novog priloga ugovoru
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id: contractId } = await params;

    try {
        // Parsiranje zahteva kao FormData (za fajl upload)
        const formData = await request.formData();

        // Pozivanje Server Akcije za dodavanje priloga
        const result = await addContractAttachment(contractId, formData);

        if (result.error) {
             if (result.error.includes("Contract not found")) {
                 return NextResponse.json({ error: result.error }, { status: 404 });
             }
             if (result.error.includes("Invalid file") || result.error.includes("Failed to upload file")) {
                 return NextResponse.json({ error: result.error }, { status: 400 });
             }
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: result.success, attachment: result.attachment }, { status: 201 });

    } catch (error) {
        console.error(`Error adding attachment for contract ${contractId} via API:`, error);
        return NextResponse.json({ error: "Failed to add attachment." }, { status: 500 });
    }
}