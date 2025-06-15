// /schemas/contract-attachment.ts

import { z } from 'zod';

// Šema za validaciju podataka priloga ugovora
export const contractAttachmentSchema = z.object({
  // contractId se obično dobija iz konteksta (URL, forma) a ne direktno validira u šemi priloga
  // contractId: z.string().cuid("Invalid contract ID format"),

  name: z.string().min(1, { message: "Attachment name is required" }), // Ime fajla
  fileUrl: z.string().url({ message: "Invalid file URL format" }), // URL gde je fajl sačuvan
  fileType: z.string().min(1, { message: "File type is required" }), // Tip fajla (MIME type)
  // uploadedById se obično dobija iz sesije korisnika na serveru
  // uploadedById: z.string().cuid("Invalid uploader ID format"),

  // created/updated at polja su obično automatski generisana u bazi
});

// Tip koji se izvodi iz Zod šeme
export type ContractAttachmentData = z.infer<typeof contractAttachmentSchema>;