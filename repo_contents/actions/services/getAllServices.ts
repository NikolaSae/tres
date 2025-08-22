// actions/services/getAllServices.ts

// Uvoz tvoje Prisma klijent instance
import { db } from '@/lib/db';
// Uvoz ServiceType enum-a ako ga koristiš u Prisma šemi za tipove servisa
import { ServiceType } from '@prisma/client';

// Opciona interfejs definicija za filtere koje funkcija prihvata
interface GetAllServicesFilters {
  type?: ServiceType; // Omogućava filtriranje po tipu servisa (npr. "BULK")
  // Dodaj ovde druge filtere koji bi mogli biti potrebni (npr. name, isActive, itd.)
}

/**
 * Server-side funkcija za dohvatanje liste servisa iz baze podataka.
 * Može opcionalno filtrirati rezultate.
 * Poziva se u Server Komponentama ili API rutama.
 */
export async function getAllServices(filters?: GetAllServicesFilters) {
  try {
    // Kreiranje objekta uslova za `where` klauzulu u Prisma upitu
    const where: any = {};

    // Ako je filter za tip servisa prosleđen, dodaj ga u where uslove
    if (filters?.type) {
      where.type = filters.type;
    }

    // Dodaj logiku za druge filtere ovde ako su definisani u interfejsu

    // Dohvati servise iz baze koristeći Prisma klijent
    const services = await db.service.findMany({
      where: where, // Primena filtera
      // Opciono: dodaj orderBy ako želiš sortiranje (npr. orderBy: { name: 'asc' })
      // Opciono: dodaj select ili include ako ti trebaju samo određena polja ili relacije
    });

    // Vrati listu pronađenih servisa
    return services;

  } catch (error) {
    // Logovanje greške ako dođe do problema pri dohvatanju iz baze
    console.error('[GET_ALL_SERVICES_ERROR]', error);
    // U slučaju greške, možeš da baciš grešku, ili da vratiš prazan niz
    // Vraćanje praznog niza sprečava pad aplikacije i omogućava da UI prikaže "nema pronađenih servisa"
    return [];
  }
}

// NAPOMENA: Pošto se ova funkcija poziva DIREKTNO unutar Server Komponente (NewBulkServicePage),
// ona se izvršava na serveru automatski. Nije neophodno dodati `"use server";` na početak
// ovog fajla, OSIM ako ovu funkciju nameravaš da pozivaš i DIREKTNO iz Client Komponenti
// kao Server Akciju. Za rešavanje trenutne greške, `"use server";` nije potreban.