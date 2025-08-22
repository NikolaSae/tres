// /lib/providers/validators.ts

import { Provider } from '@prisma/client'; // Uvoz Provider modela (osnovni tip)
// Ako imate kompleksniji tip sa relacijama, uvezite njega:
// import { ProviderWithDetails } from '@/lib/types/provider-types';

// Opciono: Uvezite Zod šemu ako neki validatori koriste njene delove ili izvode logiku iz nje
// import { providerSchema } from '@/schemas/provider';

/**
 * Proverava da li je provajder aktivan.
 * Iako je ovo jednostavno polje, utility funkcija može biti korisna za konzistentnost.
 * @param provider - Objekat provajdera.
 * @returns True ako je provajder aktivan, inače False.
 */
export function isProviderActive(provider: Pick<Provider, 'isActive'>): boolean {
    return provider.isActive;
}

/**
 * Proverava da li je provajder "validan" za određenu operaciju, npr. za povezivanje sa novim ugovorom.
 * Ovo može uključivati proveru da li je aktivan i/ili druge uslove.
 * @param provider - Objekat provajdera.
 * @param criteria - Kriterijumi validnosti (opciono, npr. { needsEmail: boolean }).
 * @returns True ako provajder zadovoljava kriterijume, inače False sa porukom o grešci.
 */
export function isProviderValidForContract(
    provider: Pick<Provider, 'isActive' | 'email' | 'name'> | null, // Prihvatamo delimičan objekat ili null
    criteria?: { needsEmail?: boolean }
): { isValid: boolean; message?: string } {
    if (!provider) {
        return { isValid: false, message: "Provider data is missing." };
    }

    if (!provider.isActive) {
        return { isValid: false, message: `Provider "${provider.name}" is not active.` };
    }

    if (criteria?.needsEmail && !provider.email) {
         return { isValid: false, message: `Provider "${provider.name}" requires an email address.` };
    }

    // Dodajte druge provere ako je potrebno...

    return { isValid: true }; // Provajder je validan
}

// Možete dodati još utility validatora ovde, npr:
// export function isValidProviderContactInfo(provider: Pick<Provider, 'email' | 'phone'>): { isValid: boolean; message?: string } { ... }
// export function doesProviderHaveOpenComplaints(providerId: string): Promise<boolean> { ... } // Zahtevalo bi DB pristup