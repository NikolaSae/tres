// /app/api/contracts/[id]/reminders/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db'; // Pretpostavljena putanja do vašeg Prisma klijenta
// U realnoj aplikaciji, verovatno biste imali middleware ili helper za proveru autentifikacije/autorizacije za /api/ rute
// import { auth } from '@/auth';

// Importovanje Server Akcije za POST
import { createContractReminder } from '@/actions/contracts/create-reminder'; // Akcija koju smo prethodno kreirali

// Handler za GET za dohvatanje podsetnika ugovora
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
    // Dohvatanje svih podsetnika za dati contractId
    const reminders = await db.contractReminder.findMany({
      where: { contractId: id },
      orderBy: { reminderDate: 'asc' }, // Podrazumevano sortiranje po datumu podsetnika
      include: {
          acknowledgedBy: { // Uključujemo podatke o korisniku koji je pregledao podsetnik
              select: { id: true, name: true }
          }
      }
    });

     // Opciono: Provera da li ugovor postoji
     // const contractExists = await db.contract.findUnique({ where: { id } });
     // if (!contractExists) {
     //    return NextResponse.json({ error: "Contract not found." }, { status: 404 });
     // }
     // Ako ugovor postoji, vraćamo listu podsetnika (može biti prazna)


    // Vraćanje liste podsetnika
    return NextResponse.json(reminders, { status: 200 });

  } catch (error) {
    console.error(`Error fetching reminders for contract ${id}:`, error);
    // Generalna greška servera
    return NextResponse.json({ error: "Failed to fetch reminders." }, { status: 500 });
  }
}

// Handler za POST za kreiranje novog podsetnika za ugovor
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


        // Pozivanje Server Akcije za kreiranje podsetnika
        const result = await createContractReminder(valuesWithContractId);

        if (result.error) {
            // Vraćanje greške dobijene iz akcije
            // Prilagoditi status kodove na osnovu tipa greške (npr. 400 za validaciju, 404 za not found)
             if (result.error.includes("Contract not found")) {
                 return NextResponse.json({ error: result.error }, { status: 404 });
             }
             // validateContractReminder utility proverava datume i tip, vraća grešku kao string[]
             if (result.error.includes("Reminder validation failed") || result.error.includes("Invalid input fields")) {
                  return NextResponse.json({ error: result.error, details: result.details }, { status: 400 });
             }
            return NextResponse.json({ error: result.error }, { status: 500 }); // Podrazumevano 500 za ostale greške akcije
        }

        // Vraćanje uspešnog odgovora sa podacima o kreiranom podsetniku
        return NextResponse.json({ success: result.success, reminder: result.reminder }, { status: 201 });

    } catch (error) {
        console.error(`Error creating reminder for contract ${contractId} via API:`, error);
        // Generalna greška servera
        return NextResponse.json({ error: "Failed to create reminder." }, { status: 500 });
    }
}

// Napomena: Ažuriranje (acknowledge) ili brisanje pojedinačnog podsetnika
// Moglo bi se implementirati na ruti /api/contracts/[id]/reminders/[reminderId]
// DELETE handler na toj ruti bi pozvao db.contractReminder.delete
// PUT handler na toj ruti bi pozvao db.contractReminder.update (kao što radi acknowledgeContractReminder akcija)
// Akcija acknowledgeContractReminder se može pozvati i direktno sa klijenta.