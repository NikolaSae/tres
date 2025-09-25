// /app/api/contracts/[id]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db'; // Pretpostavljena putanja do vašeg Prisma klijenta

import { auth } from '@/auth';

// Importovanje Server Akcija za PUT i DELETE
import { updateContract } from '@/actions/contracts/update'; // Akcija koju smo prethodno kreirali
import { deleteContract } from '@/actions/contracts/delete'; // Akcija koju smo prethodno kreirali

// Handler za GET za dohvatanje pojedinačnog ugovora po ID-u
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params; // Dobijanje ID-a iz URL-a

  // Osnovna validacija ID-a (opciono, Prisma će baciti grešku za nevalidan format)
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
        services: { // Učitavamo ServiceContract zapise
            include: { service: true } // Uključujemo i detalje Servisa povezanog sa ServiceContract
        },
        attachments: { orderBy: { uploadedAt: 'asc' } }, // Sortiranje priloga
        reminders: { orderBy: { reminderDate: 'asc' } }, // Sortiranje podsetnika
        humanitarianRenewals: { orderBy: { createdAt: 'desc' } }, // Sortiranje obnova
        createdBy: { select: { id: true, name: true } }, // Podaci o kreatoru
        lastModifiedBy: { select: { id: true, name: true } }, // Podaci o poslednjem modifikatoru
      },
    });

    if (!contract) {
      // Vraćanje 404 Not Found ako ugovor nije pronađen
      return NextResponse.json({ error: "Contract not found." }, { status: 404 });
    }

    // Vraćanje podataka o ugovoru
    return NextResponse.json(contract, { status: 200 });

  } catch (error) {
    console.error(`Error fetching contract with ID ${id}:`, error);
    // Generalna greška servera
    return NextResponse.json({ error: "Failed to fetch contract." }, { status: 500 });
  }
}

// Handler za PUT za ažuriranje ugovora po ID-u
// Delegiramo ovu logiku na Server Akciju
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
     // U realnoj aplikaciji, dodali biste proveru autentifikacije/autorizacije
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

    const { id } = params; // Dobijanje ID-a iz URL-a

    try {
        const values = await request.json();

        // Pozivanje Server Akcije za ažuriranje ugovora
        const result = await updateContract(id, values);

        if (result.error) {
             // Vraćanje greške dobijene iz akcije
            // Prilagoditi status kodove na osnovu tipa greške (npr. 400 za validaciju, 404 za not found)
            if (result.error === "Contract not found.") {
                return NextResponse.json({ error: result.error }, { status: 404 });
            }
             if (result.details) { // Greške validacije
                 return NextResponse.json({ error: result.error, details: result.details }, { status: 400 });
             }
            return NextResponse.json({ error: result.error }, { status: 400 }); // Podrazumevano 400 za ostale greške akcije
        }

        // Vraćanje uspešnog odgovora
        return NextResponse.json({ success: result.success, id: result.id }, { status: 200 });

    } catch (error) {
        console.error(`Error updating contract with ID ${id} via API:`, error);
        // Generalna greška servera
        return NextResponse.json({ error: "Failed to update contract." }, { status: 500 });
    }
}


// Handler za DELETE za brisanje ugovora po ID-u
// Delegiramo ovu logiku na Server Akciju
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
     // U realnoj aplikaciji, dodali biste proveru autentifikacije/autorizacije
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

    const { id } = params; // Dobijanje ID-a iz URL-a

    try {
        // Pozivanje Server Akcije za brisanje ugovora
        const result = await deleteContract(id);

        if (result.error) {
            // Vraćanje greške dobijene iz akcije
             if (result.error === "Contract not found.") {
                return NextResponse.json({ error: result.error }, { status: 404 });
            }
            return NextResponse.json({ error: result.error }, { status: 400 }); // Podrazumevano 400
        }

        // Vraćanje uspešnog odgovora (200 OK ili 204 No Content za uspešno brisanje)
        return NextResponse.json({ success: result.success }, { status: 200 }); // Ili status: 204

    } catch (error) {
        console.error(`Error deleting contract with ID ${id} via API:`, error);
        // Generalna greška servera
        return NextResponse.json({ error: "Failed to delete contract." }, { status: 500 });
    }
}