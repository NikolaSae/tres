// /app/api/services/[id]/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db'; // Direktno korišćenje DB za GET detalja
// Uvozimo Server Akcije za PUT i DELETE operacije
import { updateService } from '@/actions/services/update'; // Koristimo ažuriranu akciju za ažuriranje
import { deleteService } from '@/actions/services/delete'; // Koristimo ažuriranu akciju za brisanje
// Uvozimo ažuriranu Zod šemu i tip za PUT
import { serviceSchema, ServiceFormData } from '@/schemas/service';
// Uvozimo ažurirani tip za GET detalja
import { ServiceWithDetails } from '@/lib/types/service-types';
// Uvozimo auth funkcije za proveru autentifikacije/autorizacije
import { auth } from '@/auth';
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Handler za GET za dohvatanje pojedinačnog servisa po ID-u
// Dohvata više detalja (sa relacijama) nego GET na /api/services
// Usklađen sa Service modelom u schema.prisma.
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } } // Hvatanje dinamičkog segmenta rute ([id])
): Promise<NextResponse<ServiceWithDetails | { error: string }>> { // Explicitno tipiziramo povratnu vrednost
    // Provera da li je korisnik ulogovan
     const session = await auth();
     if (!session?.user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
     // Provera uloge ako je potrebna

    const { id } = params; // Dobijanje ID-a iz URL-a

    try {
        // Dohvatanje servisa sa relacijama iz schema.prisma Service modela
        const service = await db.service.findUnique({
            where: { id },
             include: {
                  // Uključite relacije potrebne za prikaz detalja (iz schema.prisma)
                  // Relacija 'products' NE postoji na Service modelu u vašoj šemi
                  contracts: { // Relacija ServiceContract[]
                       select: {
                            id: true,
                            contractId: true,
                            serviceId: true,
                            specificTerms: true,
                            createdAt: true,
                             // Opciono: uključiti detalje o samom ugovoru ako je potrebno
                             // contract: { select: { id: true, name: true, contractNumber: true } }
                       },
                       orderBy: { createdAt: 'desc' }
                  },
                  vasServices: true, // Relacija VasService[]
                  bulkServices: true, // Relacija BulkService[]
                  complaints: true, // Relacija Complaint[]
                 _count: { // Brojači za detalje
                      select: {
                           contracts: true,
                           vasServices: true,
                           bulkServices: true,
                           complaints: true
                       }
                 }
            }
        });

        if (!service) {
            // Vraćanje 404 Not Found ako servis nije pronađen
            return NextResponse.json({ error: "Service not found." }, { status: 404 });
        }

        // Vraćanje podataka, kastovano na custom tip
        return NextResponse.json(service as ServiceWithDetails, { status: 200 });

    } catch (error) {
        console.error(`Error fetching service with ID ${id} via API:`, error);
        // Generalna greška servera
        return NextResponse.json({ error: "Failed to fetch service." }, { status: 500 });
    }
}

// Handler za PUT za ažuriranje servisa po ID-u
// Koristi ažuriranu actions/services/update.ts akciju
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> { // Vraća NextResponse
     // Provera autorizacije - samo ADMIN ili MANAGER mogu ažurirati servise
     const role = await currentRole();
     if (role !== UserRole.ADMIN && role !== UserRole.MANAGER) { // Prilagodite uloge
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     }

    const { id } = params; // Dobijanje ID-a iz URL-a

    try {
        const values: ServiceFormData = await request.json(); // Očekujemo JSON telo zahteva

         // Validacija ulaznih podataka (opciono, akcija takođe validira)
         const validationResult = serviceSchema.safeParse(values);
         if (!validationResult.success) {
              console.error(`Service API PUT validation failed for ID ${id}:`, validationResult.error.errors);
              return NextResponse.json({ error: "Invalid service data.", details: validationResult.error.errors }, { status: 400 });
         }


        // Pozivanje AŽURIRANE Server Akcije za ažuriranje servisa
         const result = await updateService(id, validationResult.data);


        if (result.error) {
            // Vraćanje greške dobijene iz akcije
             if (result.error === "Forbidden") return NextResponse.json({ error: result.error }, { status: 403 });
             if (result.error === "Service not found.") {
                return NextResponse.json({ error: result.error }, { status: 404 });
             }
             if (result.details) { // Greške validacije iz Zoda (ako ih akcija vrati)
                 return NextResponse.json({ error: result.error, details: result.details }, { status: 400 });
             }
             // Provera specifičnih grešaka (npr. Unique constraint)
             if (result.error.includes("already exists")) { // Akcija proverava jedinstvenost po 'name'
                  return NextResponse.json({ error: result.error }, { status: 409 }); // Conflict
             }
            return NextResponse.json({ error: result.error }, { status: 400 }); // Podrazumevano 400
        }

        // Vraćanje uspešnog odgovora
        return NextResponse.json({ success: result.success, id: result.id }, { status: 200 }); // Status 200 OK

    } catch (error) {
        console.error(`Error updating service with ID ${id} via API:`, error);
        // Generalna greška servera
        return NextResponse.json({ error: "Failed to update service." }, { status: 500 });
    }
}


// Handler za DELETE za brisanje servisa po ID-u
// Koristi ažuriranu actions/services/delete.ts akciju
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> { // Vraća NextResponse
     // Provera autorizacije - samo ADMIN može brisati servise (ili viša uloga)
     const role = await currentRole();
     // Možda samo ADMIN može brisati, a MANAGER samo ažurirati? Prilagodite uloge.
     if (role !== UserRole.ADMIN) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     }

    const { id } = params; // Dobijanje ID-a iz URL-a

    try {
        // Pozivanje AŽURIRANE Server Akcije za brisanje servisa
         const result = await deleteService(id);


        if (result.error) {
            // Vraćanje greške dobijene iz akcije
             if (result.error === "Forbidden") return NextResponse.json({ error: result.error }, { status: 403 });
             if (result.error.includes("not found")) { // Akcija vraća "Service not found." ili P2025 grešku
                return NextResponse.json({ error: result.error }, { status: 404 });
             }
             // Provera specifične greške (npr. foreign key constraint)
             if (result.error.includes("Cannot delete service because it is associated")) { // Akcija vraća ovu poruku za P2003
                return NextResponse.json({ error: result.error }, { status: 409 }); // Conflict
             }
            return NextResponse.json({ error: result.error }, { status: 400 }); // Podrazumevano 400
        }

        // Vraćanje uspešnog odgovora (200 OK ili 204 No Content za uspešno brisanje)
        return NextResponse.json({ success: result.success }, { status: 200 }); // Status 200 OK (ili 204 No Content je takođe opcija)

    } catch (error) {
        console.error(`Error deleting service with ID ${id} via API:`, error);
        // Generalna greška servera
        return NextResponse.json({ error: "Failed to delete service." }, { status: 500 });
    }
}

// OPTIONS handler je često potreban za CORS prefetch
export async function OPTIONS() {
    return NextResponse.json({}, { status: 200 });
}