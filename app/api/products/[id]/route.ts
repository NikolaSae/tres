// /app/api/products/[id]/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db'; // Direktno korišćenje DB za GET detalja
// Uvozimo Server Akcije za PUT i DELETE operacije
import { updateProduct } from '@/actions/products/update'; // Koristimo ažuriranu akciju za ažuriranje
import { deleteProduct } from '@/actions/products/delete'; // Koristimo ažuriranu akciju za brisanje
// Uvozimo ažuriranu Zod šemu i tip za PUT
import { productSchema, ProductFormData } from '@/schemas/product';
// Uvozimo ažurirani tip za GET detalja
import { ProductWithDetails } from '@/lib/types/product-types';
// Uvozimo auth funkcije za proveru autentifikacije/autorizacije
import { auth } from '@/auth';
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'; // Uvozimo za rukovanje 404/409


// Handler za GET za dohvatanje pojedinačnog proizvoda po ID-u
// Dohvata više detalja (sa relacijama) nego GET na /api/products
// Usklađen sa Product modelom u schema.prisma.
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } } // Hvatanje dinamičkog segmenta rute ([id])
): Promise<NextResponse<ProductWithDetails | { error: string }>> { // Explicitno tipiziramo povratnu vrednost
     // Provera da li je korisnik ulogovan
     const session = await auth();
     if (!session?.user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
     // Provera uloge ako je potrebna

    const { id } = params; // Dobijanje ID-a iz URL-a

    try {
        // Dohvatanje proizvoda sa relacijama iz schema.prisma Product modela
        const product = await db.product.findUnique({
            where: { id },
             include: {
                  // Uključite relacije potrebne za prikaz detalja (iz schema.prisma)
                 complaints: { // Relacija Complaint[]
                      select: {
                           id: true,
                           title: true,
                           status: true,
                           createdAt: true,
                           // Uključite relaciju Provider ako je potrebna na listi reklamacija
                           // provider: { select: { id: true, name: true } }
                       },
                      orderBy: { createdAt: 'desc' }
                 },
                  // Relacija 'service' NE postoji
                 _count: { // Brojači za detalje
                      select: { complaints: true }
                 }
            }
        });

        if (!product) {
            // Vraćanje 404 Not Found ako proizvod nije pronađen
            return NextResponse.json({ error: "Product not found." }, { status: 404 });
        }

        // Vraćanje podataka, kastovano na custom tip
        return NextResponse.json(product as ProductWithDetails, { status: 200 });

    } catch (error) {
        console.error(`Error fetching product with ID ${id} via API:`, error);
        // Rukovanje specifičnim Prisma greškama (npr. P2025 ako ID nije u dobrom formatu ili slično - malo verovatno ovde)
         if (error instanceof PrismaClientKnownRequestError) {
              if (error.code === 'P2025') { // Record to find does not exist (iako smo već proverili)
                   return NextResponse.json({ error: `Product with ID ${id} not found (Prisma error).` }, { status: 404 });
              }
         }
        // Generalna greška servera
        return NextResponse.json({ error: "Failed to fetch product." }, { status: 500 });
    }
}

// Handler za PUT za ažuriranje proizvoda po ID-u
// Koristi ažuriranu actions/products/update.ts akciju
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> { // Vraća NextResponse
     // Provera autorizacije - samo ADMIN ili MANAGER mogu ažurirati proizvode
     const role = await currentRole();
     if (role !== UserRole.ADMIN && role !== UserRole.MANAGER) { // Prilagodite uloge
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     }

    const { id } = params; // Dobijanje ID-a iz URL-a

    try {
        const values: ProductFormData = await request.json(); // Očekujemo JSON telo zahteva

         // Validacija ulaznih podataka (opciono, akcija takođe validira)
         const validationResult = productSchema.safeParse(values);
         if (!validationResult.success) {
              console.error(`Product API PUT validation failed for ID ${id}:`, validationResult.error.errors);
              return NextResponse.json({ error: "Invalid product data.", details: validationResult.error.errors }, { status: 400 });
         }


        // Pozivanje AŽURIRANE Server Akcije za ažuriranje proizvoda
         const result = await updateProduct(id, validationResult.data);


        if (result.error) {
            // Vraćanje greške dobijene iz akcije
             if (result.error === "Forbidden") return NextResponse.json({ error: result.error }, { status: 403 });
             if (result.error.includes("not found")) { // Akcija vraća "Product not found." ili P2025
                return NextResponse.json({ error: result.error }, { status: 404 });
             }
             if (result.details) { // Greške validacije iz Zoda
                 return NextResponse.json({ error: result.error, details: result.details }, { status: 400 });
             }
             // Provera specifičnih grešaka (npr. Unique constraint za 'code')
             if (result.error.includes("already exists")) { // Akcija vraća ovu poruku za Unique constraint na 'code'
                  return NextResponse.json({ error: result.error }, { status: 409 }); // Conflict
             }
            return NextResponse.json({ error: result.error }, { status: 400 }); // Podrazumevano 400
        }

        // Vraćanje uspešnog odgovora
        return NextResponse.json({ success: result.success, id: result.id }, { status: 200 }); // Status 200 OK

    } catch (error) {
        console.error(`Error updating product with ID ${id} via API:`, error);
        // Generalna greška servera
        return NextResponse.json({ error: "Failed to update product." }, { status: 500 });
    }
}


// Handler za DELETE za brisanje proizvoda po ID-u
// Koristi ažuriranu actions/products/delete.ts akciju
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> { // Vraća NextResponse
     // Provera autorizacije - samo ADMIN može brisati proizvode (ili viša uloga)
     const role = await currentRole();
     // Možda samo ADMIN može brisati, a MANAGER samo ažurirati? Prilagodite uloge.
     if (role !== UserRole.ADMIN) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     }

    const { id } = params; // Dobijanje ID-a iz URL-a

    try {
        // Pozivanje AŽURIRANE Server Akcije za brisanje proizvoda
         const result = await deleteProduct(id);


        if (result.error) {
            // Vraćanje greške dobijene iz akcije
             if (result.error === "Forbidden") return NextResponse.json({ error: result.error }, { status: 403 });
             if (result.error.includes("not found")) { // Akcija vraća poruku ili P2025
                return NextResponse.json({ error: result.error }, { status: 404 });
             }
             // Provera specifične greške (npr. foreign key constraint)
             if (result.error.includes("Cannot delete product because it is associated")) { // Akcija vraća ovu poruku za P2003
                return NextResponse.json({ error: result.error }, { status: 409 }); // Conflict
             }
            return NextResponse.json({ error: result.error }, { status: 400 }); // Podrazumevano 400
        }

        // Vraćanje uspešnog odgovora
        return NextResponse.json({ success: result.success }, { status: 200 }); // Status 200 OK (ili 204 No Content)

    } catch (error) {
        console.error(`Error deleting product with ID ${id} via API:`, error);
        // Generalna greška servera
        return NextResponse.json({ error: "Failed to delete product." }, { status: 500 });
    }
}

// OPTIONS handler je često potreban za CORS prefetch
export async function OPTIONS() {
    return NextResponse.json({}, { status: 200 });
}