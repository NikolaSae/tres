// /app/api/contracts/[id]/attachments/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db'; // Pretpostavljena putanja do vašeg Prisma klijenta
// U realnoj aplikaciji, verovatno biste imali middleware ili helper za proveru autentifikacije/autorizacije za /api/ rute
// import { auth } from '@/auth';

// Importovanje Server Akcije za POST
import { addContractAttachment } from '@/actions/contracts/add-attachment'; // Akcija koju smo prethodno kreirali

// Handler za GET za dohvatanje priloga ugovora
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // Hvatanje ID-a ugovora iz URL-a
) {
  // U realnoj aplikaciji, dodali biste proveru autentifikacije/autorizacije
  // const session = await auth();
  // if (!session?.user) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  const { id } = params; // Dobijanje ID-a ugovora

  try {
    // Dohvatanje svih priloga za dati contractId
    const attachments = await db.contractAttachment.findMany({
      where: { contractId: id },
      orderBy: { uploadedAt: 'asc' }, // Podrazumevano sortiranje po datumu otpremanja
      include: {
          uploadedBy: { // Uključujemo podatke o korisniku koji je otpremio fajl
              select: { id: true, name: true }
          }
      }
    });

     // Opciono: Provera da li ugovor postoji
     // const contractExists = await db.contract.findUnique({ where: { id } });
     // if (!contractExists) {
     //    return NextResponse.json({ error: "Contract not found." }, { status: 404 });
     // }
     // Ako ugovor postoji, vraćamo listu priloga (može biti prazna)

    // Vraćanje liste priloga
    return NextResponse.json(attachments, { status: 200 });

  } catch (error) {
    console.error(`Error fetching attachments for contract ${id}:`, error);
    // Generalna greška servera
    return NextResponse.json({ error: "Failed to fetch attachments." }, { status: 500 });
  }
}

// Handler za POST za dodavanje novog priloga ugovoru
// Delegiramo ovu logiku na Server Akciju
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
     // U realnoj aplikaciji, dodali biste proveru autentifikacije/autorizacije
     // const session = await auth();
     // if (!session?.user) {
     //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     // }

    const { id: contractId } = params; // Dobijanje ID-a ugovora i preimenovanje u contractId

    try {
        // Parsiranje zahteva kao FormData (za fajl upload)
        const formData = await request.formData();

        // Pozivanje Server Akcije za dodavanje priloga
        const result = await addContractAttachment(contractId, formData);

        if (result.error) {
            // Vraćanje greške dobijene iz akcije
            // Prilagoditi status kodove na osnovu tipa greške (npr. 400 za validaciju, 404 za not found)
             if (result.error.includes("Contract not found")) {
                 return NextResponse.json({ error: result.error }, { status: 404 });
             }
             if (result.error.includes("Invalid file") || result.error.includes("Failed to upload file")) {
                 return NextResponse.json({ error: result.error }, { status: 400 });
             }
            return NextResponse.json({ error: result.error }, { status: 500 }); // Podrazumevano 500 za ostale greške akcije
        }

        // Vraćanje uspešnog odgovora sa podacima o kreiranom prilogu
        return NextResponse.json({ success: result.success, attachment: result.attachment }, { status: 201 });

    } catch (error) {
        console.error(`Error adding attachment for contract ${contractId} via API:`, error);
        // Generalna greška servera
        return NextResponse.json({ error: "Failed to add attachment." }, { status: 500 });
    }
}