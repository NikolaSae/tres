// /lib/humanitarian-orgs/validators.ts

// Uvozimo model Humanitarne Organizacije (osnovni tip)
import { HumanitarianOrg } from '@prisma/client';

// Opciono: Uvozite Zod šemu ako neki validatori koriste njene delove ili izvode logiku iz nje
// import { humanitarianOrgSchema } from '@/schemas/humanitarian-org';

/**
 * Proverava da li je humanitarna organizacija aktivna.
 * @param organization - Objekat humanitarne organizacije.
 * @returns True ako je organizacija aktivna, inače False.
 */
export function isHumanitarianOrgActive(organization: Pick<HumanitarianOrg, 'isActive'>): boolean {
    return organization.isActive;
}

/**
 * Proverava da li je humanitarna organizacija "validna" za određenu operaciju, npr. za povezivanje sa novim ugovorom.
 * Ovo može uključivati proveru da li je aktivna i/ili druge uslove.
 * @param organization - Objekat humanitarne organizacije (može biti null).
 * @param criteria - Kriterijumi validnosti (opciono, npr. { needsEmail: boolean }).
 * @returns True ako organizacija zadovoljava kriterijume, inače False sa porukom o grešci.
 */
export function isHumanitarianOrgValidForContract(
    organization: Pick<HumanitarianOrg, 'isActive' | 'email' | 'name'> | null, // Prihvatamo delimičan objekat ili null
    criteria?: { needsEmail?: boolean }
): { isValid: boolean; message?: string } {
    if (!organization) {
        return { isValid: false, message: "Humanitarian organization data is missing." };
    }

    if (!organization.isActive) {
        return { isValid: false, message: `Organization "${organization.name}" is not active.` };
    }

    if (criteria?.needsEmail && !organization.email) {
         return { isValid: false, message: `Organization "${organization.name}" requires an email address.` };
    }

    // Dodajte druge provere ako je potrebno...

    return { isValid: true }; // Organizacija je validna
}

// Možete dodati još utility validatora ovde, npr:
// export function isValidHumanitarianOrgContactInfo(organization: Pick<HumanitarianOrg, 'email' | 'phone'>): { isValid: boolean; message?: string } { ... }
// export function doesHumanitarianOrgHaveOpenComplaints(orgId: string): Promise<boolean> { ... } // Zahtevalo bi DB pristup