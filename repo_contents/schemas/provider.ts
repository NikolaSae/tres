// /schemas/provider.ts

import { z } from 'zod';

// Šema za validaciju podataka provajdera
export const providerSchema = z.object({
    // ID nije potreban pri kreiranju, ali je potreban pri validaciji za ažuriranje (ako je uključen)
    // id: z.string().cuid("Invalid provider ID format").optional(),

    name: z.string().min(1, { message: "Provider name is required" }),
    contactName: z.string().nullable().optional(), // Može biti null ili undefined, ali ako je string, mora biti non-empty ako želite minLength
    // Možete dodati refine ako želite da prazan string bude null/undefined
    // contactName: z.string().nullable().optional().transform(e => e === "" ? null : e),


    email: z.string().email("Invalid email format").nullable().optional(), // Može biti null/undefined, ali ako je string, mora biti validan email
    // email: z.string().email("Invalid email format").or(z.literal('')).nullable().optional().transform(e => e === "" ? null : e), // Primer kako rukovati praznim stringom kao null

    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),

    // Checkbox forma obično vraća boolean. Ako forma koristi 'true'/'false' stringove, potrebno je transformisati
    isActive: z.boolean({
        invalid_type_error: "Active status must be true or false",
    }).default(true), // Podrazumevano aktivan

    // Dodano imageUrl polje - može biti string, null ili undefined
    imageUrl: z.string().nullable().optional(),


    // Audit polja i relacije (obično nisu deo forme za kreiranje/ažuriranje)
    // createdAt: z.date().optional(),
    // updatedAt: z.date().optional(),
    // contracts: z.array(...).optional(),
    // ... ostale relacije
});


// Tip koji se izvodi iz Zod šeme za korišćenje u TypeScript kodu (za formu i akcije)
export type ProviderFormData = z.infer<typeof providerSchema>;


// Opciono: Šema za validaciju pri ažuriranju ako ima dodatnih uslova (npr. ID je obavezan)
// export const updateProviderSchema = providerSchema.extend({
//     id: z.string().cuid("Provider ID is required for updating"),
// });
// export type UpdateProviderFormData = z.infer<typeof updateProviderSchema>;
