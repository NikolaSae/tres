// schemas/humanitarian-renewal.ts
import { z } from "zod";

export const HumanitarianRenewalSubStatusEnum = z.enum([
  "DOCUMENT_COLLECTION",
  "LEGAL_REVIEW",
  "FINANCIAL_APPROVAL",
  "AWAITING_SIGNATURE",
  "FINAL_PROCESSING"
]);

// Prvo definiramo bazni schema objekat
const baseHumanitarianRenewalSchema = z.object({
  contractId: z.string().min(1, "Ugovor je obavezan").optional(), // Može biti opcionalan za kreiranje
  humanitarianOrgId: z.string().min(1, "Humanitarna organizacija je obavezna").optional(), // Može biti opcionalan za kreiranje
  subStatus: HumanitarianRenewalSubStatusEnum.default("DOCUMENT_COLLECTION"),
  proposedStartDate: z.string().min(1, "Predloženi početak je obavezan")
    .refine((date) => !isNaN(Date.parse(date)), "Neispravna vrednost datuma"),
  proposedEndDate: z.string().min(1, "Predloženi kraj je obavezan")
    .refine((date) => !isNaN(Date.parse(date)), "Neispravna vrednost datuma"),
  proposedRevenue: z.number()
    .min(0, "Procenat prihoda mora biti pozitivan")
    .max(100, "Procenat prihoda ne može biti veći od 100%"),
  documentsReceived: z.boolean().default(false),
  legalApproved: z.boolean().default(false),
  financialApproved: z.boolean().default(false),
  signatureReceived: z.boolean().default(false),
  notes: z.string().optional(),
});

// Zatim primenjujemo refine na schema za kreiranje
export const createHumanitarianRenewalSchema = baseHumanitarianRenewalSchema.refine((data) => {
  const startDate = new Date(data.proposedStartDate);
  const endDate = new Date(data.proposedEndDate);
  return startDate < endDate;
}, {
  message: "Datum početka mora biti pre datuma kraja",
  path: ["proposedEndDate"],
});

// A za update, extendujemo bazni schema, pa onda primenjujemo refine (ako je potrebno)
export const updateHumanitarianRenewalSchema = baseHumanitarianRenewalSchema.extend({
  id: z.string().min(1, "ID je obavezan"),
  // U zavisnosti od logike, ovdje možda želite da svi propovi budu optional
  // contractId: z.string().min(1, "Ugovor je obavezan").optional(),
  // itd.
})
// Ako želite da i update schema ima istu proveru datuma, možete je dodati ovde:
.refine((data) => {
  if (data.proposedStartDate && data.proposedEndDate) {
    const startDate = new Date(data.proposedStartDate);
    const endDate = new Date(data.proposedEndDate);
    return startDate < endDate;
  }
  return true; // Omogućite da datumi budu opcionalni za ažuriranje, ali proverite ako su prisutni
}, {
  message: "Datum početka mora biti pre datuma kraja",
  path: ["proposedEndDate"],
});


export const renewalFiltersSchema = z.object({
  status: HumanitarianRenewalSubStatusEnum.optional(),
  organizationId: z.string().optional(),
  contractId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export type CreateHumanitarianRenewalInput = z.infer<typeof createHumanitarianRenewalSchema>;
export type UpdateHumanitarianRenewalInput = z.infer<typeof updateHumanitarianRenewalSchema>;
export type RenewalFilters = z.infer<typeof renewalFiltersSchema>;
export type HumanitarianRenewalSubStatus = z.infer<typeof HumanitarianRenewalSubStatusEnum>;