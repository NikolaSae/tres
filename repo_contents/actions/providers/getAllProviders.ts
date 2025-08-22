// actions/providers/getAllProviders.ts

// Uvoz tvoje Prisma klijent instance
import { db } from '@/lib/db';

// Opciona interfejs definicija za filtere koje funkcija prihvata
interface GetAllProvidersFilters {
  isActive?: boolean; // Omogućava filtriranje po isActive statusu
  // Dodaj ovde druge filtere koji bi mogli biti potrebni (npr. name search, itd.)
}

/**
 * Server-side funkcija za dohvatanje liste provajdera iz baze podataka.
 * Može opcionalno filtrirati rezultate.
 * Poziva se u Server Komponentama ili API rutama.
 */
export async function getAllProviders(filters?: GetAllProvidersFilters) {
  try {
    // Kreiranje objekta uslova za `where` klauzulu u Prisma upitu
    const where: any = {};

    // Primena isActive filtera ako je prosleđen
    // NAPOMENA: Na osnovu prethodne Prisma šeme koju si poslao, model `Provider`
    // NEMA `isActive` polje. Ako ti je ovo filtriranje zaista potrebno, moraćeš
    // ili da dodaš `isActive` polje u Prisma šemu za Provider model,
    // ili da implementiraš filtriranje na osnovu povezanih entiteta (npr. provajderi koji imaju aktivan ugovor).
    // Trenutna implementacija pretpostavlja da isActive postoji na Provider modelu i filtrira direktno po njemu.
    if (filters?.isActive !== undefined) {
       where.isActive = filters.isActive;
       // Ako isActive zavisi od ugovora, WHERE klauzula bi bila kompleksnija, npr:
       // where.contracts = {
       //   some: {
       //     status: 'ACTIVE' // Pretpostavljajući da Contract model ima status polje
       //   }
       // };
    }

    // Dodaj logiku za druge filtere ovde ako su definisani u interfejsu (npr. pretraga po imenu)

    // Dohvati provajdere iz baze koristeći Prisma klijent
    const providers = await db.provider.findMany({
      where: where, // Primena filtera (sa napomenom o isActive)
      // Opciono: dodaj orderBy ako želiš sortiranje (npr. orderBy: { name: 'asc' })
      // Opciono: dodaj select ili include ako ti trebaju samo određena polja ili relacije
    });

    // Vrati listu pronađenih provajdera
    return providers;

  } catch (error) {
    // Logovanje greške ako dođe do problema pri dohvatanju iz baze
    console.error('[GET_ALL_PROVIDERS_ERROR]', error);
    // U slučaju greške, možeš da baciš grešku, ili da vratiš prazan niz
    // Vraćanje praznog niza sprečava pad aplikacije i omogućava da UI prikaže "nema pronađenih provajdera"
    return [];
  }
}

// NAPOMENA: Kao i kod getAllServices, pošto se ova funkcija poziva DIREKTNO unutar Server Komponente
// (`NewBulkServicePage`), ona se izvršava na serveru automatski. Dodavanje `"use server";`
// na početak ovog fajla nije striktno neophodno, OSIM ako ovu funkciju nameravaš
// da pozivaš i DIREKTNO iz Client Komponenti kao Server Akciju. Za rešavanje
// trenutne greške, `"use server";` nije potreban.