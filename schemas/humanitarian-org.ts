// /schemas/humanitarian-org.ts

import { z } from 'zod';

// Šema za validaciju podataka humanitarne organizacije
export const humanitarianOrgSchema = z.object({
    // ID nije obavezan pri kreiranju, ali može biti prisutan pri validaciji za ažuriranje
    id: z.string().cuid("Invalid organization ID format").optional(),

    name: z.string().min(1, { message: "Organization name is required" }),
    contactPerson: z.string().nullable().optional(),
    // Validacija email formata, dozvoljava null ili prazan string ako transformišemo
    email: z.string().email("Invalid email format").or(z.literal('')).nullable().optional().transform(e => e === "" ? null : e),

    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    // Validacija URL formata za website, dozvoljava null ili prazan string ako transformišemo
    website: z.string().url("Invalid website URL format").or(z.literal('')).nullable().optional().transform(e => e === "" ? null : e),

    mission: z.string().nullable().optional(),

    // Checkbox forma obično vraća boolean
    isActive: z.boolean({
        invalid_type_error: "Active status must be true or false",
    }).default(true), // Podrazumevano aktivan

    // Audit polja i relacije (obično nisu deo forme)
    // createdAt: z.date().optional(),
    // updatedAt: z.date().optional(),
    // contracts: z.array(...).optional(),
    // complaints: z.array(...).optional(),
    // humanitarianRenewals: z.array(...).optional(),
    // createdBy, lastModifiedBy, itd.
});


// Tip koji se izvodi iz Zod šeme za korišćenje u TypeScript kodu (za formu i akcije)
// Sada možemo izvesti stvarni tip
export type HumanitarianOrgFormData = z.infer<typeof humanitarianOrgSchema>;