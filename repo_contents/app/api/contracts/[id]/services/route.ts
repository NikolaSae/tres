// /app/api/contracts/[id]/services/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db'; // Pretpostavljena putanja do vašeg Prisma klijenta
// U realnoj aplikaciji, verovatno biste imali middleware ili helper za proveru autentifikacije/autorizacije za /api/ rute
// import { auth } from '@/auth';

// Importovanje Server Akcije za POST
import { addContractService } from '@/actions/contracts/add-service'; // Akcija koju smo prethodno kreirali

// Handler za GET za dohvatanje servisa povezanih sa ugovorom
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
    // Dohvatanje svih ServiceContract zapisa za dati contractId
    // Uključujemo detalje o samom Servisu
    const serviceLinks = await db.serviceContract.findMany({
      where: { contractId: id },
      include: {
          service: true, // Uključujemo detalje Servisa
      },
      orderBy: { createdAt: 'asc' }, // Podrazumevano sortiranje
    });

     // Opciono: Provera da li ugovor postoji
     // const contractExists = await db.contract.findUnique({ where: { id } });
     // if (!contractExists) {
     //    return NextResponse.json({ error: "Contract not found." }, { status: 404 });
     // }
     // Ako ugovor postoji, vraćamo listu povezanih servisa (može biti prazna)


    // Vraćanje liste povezanih servisa (ServiceContract zapisa)
    return NextResponse.json(serviceLinks, { status: 200 });

  } catch (error) {
    console.error(`Error fetching services for contract ${id}:`, error);
    // Generalna greška servera
    return NextResponse.json({ error: "Failed to fetch services." }, { status: 500 });
  }
}

// Handler za POST za dodavanje novog servisa ugovoru (kreiranje ServiceContract zapisa)
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
        const values = await request.json();
        // Dodajemo contractId iz URL-a u objedinjenje vrednosti za akciju
        const valuesWithContractId = { ...values, contractId };

        // Pozivanje Server Akcije za dodavanje servisa
        const result = await addContractService(valuesWithContractId);

        if (result.error) {
            // Vraćanje greške dobijene iz akcije
            // Prilagoditi status kodove na osnovu tipa greške (npr. 400 za validaciju, 404 za not found)
             if (result.error.includes("Contract not found") || result.error.includes("Service not found")) {
                 return NextResponse.json({ error: result.error }, { status: 404 });
             }
             if (result.error.includes("Service is already linked") || result.error.includes("Invalid input fields")) {
                 return NextResponse.json({ error: result.error }, { status: 400 });
             }
            return NextResponse.json({ error: result.error }, { status: 500 }); // Podrazumevano 500 za ostale greške akcije
        }

        // Vraćanje uspešnog odgovora sa podacima o kreiranom ServiceContract zapisu
        return NextResponse.json({ success: result.success, serviceContract: result.serviceContract }, { status: 201 });

    } catch (error) {
        console.error(`Error adding service to contract ${contractId} via API:`, error);
        // Generalna greška servera
        return NextResponse.json({ error: "Failed to link service to contract." }, { status: 500 });
    }
}

// Napomena: Brisanje (remove) specifične ServiceContract veze
// Može se implementirati kao DELETE handler na ruti /api/contracts/[id]/services/[serviceId]
// ILI kao DELETE handler na ovoj ruti (/api/contracts/[id]/services) sa serviceId u telu ili query parametrima.
// Budući da akcija removeContractService postoji, možete je pozvati unutar DELETE handlera ovde ili na odvojenoj ruti.