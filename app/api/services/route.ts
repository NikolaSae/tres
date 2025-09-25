// /app/api/services/route.ts
'use server'; // API rute mogu biti Server ili Edge, ali interakcija sa bazom sugeriše Server okruženje

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db'; // Pretpostavljena putanja do vašeg Prisma klijenta
import { ServiceType } from '@prisma/client'; // Uvozimo enum ServiceType iz Prisma klijenta

// Uvozimo Zod šemu i tip forme za Service ako su definisani (spadaju pod Sekciju 5.5 Schemas)
// import { serviceSchema, ServiceFormData } from '@/schemas/service'; // Pretpostavljena putanja
// Uvozimo Server Akciju za kreiranje servisa ako je definisana (spada pod Sekciju 5.3 Actions)
// import { createService } from '@/actions/services/create'; // Pretpostavljena putanja

// U realnoj aplikaciji, dodali biste proveru autentifikacije/autorizacije
import { auth } from '@/auth';
// import { currentRole } from "@/lib/auth";
// import { UserRole } from "@prisma/client";


// Handler za GET za dohvatanje liste servisa, opciono filtriranih po tipu
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = request.nextUrl;
    const typeParam = searchParams.get('type');

        let where: any = {}; // Prisma where klauzula

        // Ako postoji type parametar, dodajemo ga u where klauzulu
        if (typeParam) {
            // Proveravamo da li je dobijeni string validan ServiceType enum
            // ServiceType je enum iz Prisma klijenta generisan na osnovu schema.prisma
            const validServiceTypes = Object.values(ServiceType);
            const isValidServiceType = validServiceTypes.includes(typeParam as ServiceType);

            if (isValidServiceType) {
                where.type = typeParam as ServiceType; // Filtriramo po validnom tipu
            } else {
                // Vraćamo 400 Bad Request ako je tip nevalidan prema Prisma enum-u
                return NextResponse.json({ error: `Invalid service type parameter. Must be one of: ${validServiceTypes.join(', ')}` }, { status: 400 });
            }
        }

        // Opciono: Implementirajte paginaciju ako je potrebno
        // const limit = searchParams.get('limit');
        // const offset = searchParams.get('offset');
        // const take = limit ? parseInt(limit, 10) : undefined;
        // const skip = offset ? parseInt(offset, 10) : undefined;


        // Dohvatanje servisa iz baze na osnovu where klauzule i paginacije
        const services = await db.service.findMany({
            where,
            orderBy: { name: 'asc' }, // Podrazumevano sortiranje po imenu
            // take: take, // Primena paginacije
            // skip: skip,
            // Opciono: include relevantne relacije ako su potrebne na listi/selectu
            // include: { ... }
        });

        // Vraćamo listu servisa u formatu koji očekuje ServiceSelector ili druga klijentska logika
        return NextResponse.json({ services: services }, { status: 200 });

    } catch (error) {
        console.error("Error fetching services:", error);
        // Vraćamo 500 Internal Server Error u slučaju greške
        return NextResponse.json({ error: "Failed to fetch services." }, { status: 500 });
    }
}


// Handler za POST za kreiranje novog servisa
// Ovo je placeholder - stvarna logika kreiranja servisa bi verovatno bila u Server Akciji
// Ova API ruta bi mogla da prima podatke sa klijenta i prosleđuje ih Server Akciji
export async function POST(request: NextRequest) {
    // U realnoj aplikaciji, dodali biste proveru autentifikacije/autorizacije (npr. samo ADMIN/MANAGER)
     // const role = await currentRole(); // Pretpostavka da currentRole() postoji
     // if (role !== UserRole.ADMIN && role !== UserRole.MANAGER) { // Prilagodite uloge
     //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     // }

    try {
        const values = await request.json();

        // Pozivanje Server Akcije za kreiranje servisa
        // Ovo zahteva da imate definisanu Server Akciju /actions/services/create.ts
        // const result = await createService(values); // Ovu akciju morate kreirati

        // Pošto akcija createService verovatno još ne postoji, vraćamo status da ova funkcionalnost nije spremna
         return NextResponse.json({ error: "Service creation functionality is not implemented yet." }, { status: 501 }); // 501 Not Implemented

        // Ako bi akcija postojala i radila:
        // if (result.error) {
        //     // Rukovanje greškama iz akcije (npr. validacija, jedinstvenost)
        //     return NextResponse.json({ error: result.error }, { status: 400 }); // Prilagodite status kod
        // }
        // Vraćanje uspešnog odgovora sa ID-jem novog servisa
        // return NextResponse.json({ success: result.success, id: result.id }, { status: 201 }); // 201 Created

    } catch (error) {
        console.error("Error creating service via API:", error);
        // Generalna greška servera
        return NextResponse.json({ error: "Failed to create service." }, { status: 500 });
    }
}

// Po potrebi, na /api/services/[id]/route.ts bi se implementirali GET, PUT, DELETE za pojedinačni servis.