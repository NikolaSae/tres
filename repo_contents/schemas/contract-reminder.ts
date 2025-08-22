// /schemas/contract-reminder.ts

import { z } from 'zod';

// Šema za validaciju podataka pri kreiranju podsetnika
export const createContractReminderSchema = z.object({
  // contractId se obično dobija iz konteksta (URL, forma), ali može se uključiti ako se validira ceo objekat
  // contractId: z.string().cuid("Invalid contract ID format"),

  reminderDate: z.string().refine((val) => !isNaN(new Date(val).getTime()), { // Validacija datuma kao string
     message: "Reminder date is required and must be a valid date",
  }).transform((val) => new Date(val)), // Transformiši u Date objekat
  reminderType: z.string().min(1, { message: "Reminder type is required" }), // Tip podsetnika (string)
  // Opciono: rigoroznija validacija tipa ako koristite fiksne vrednosti
  // reminderType: z.enum(["expiration", "renewal", "review"], {
  //   errorMap: () => ({ message: "Invalid reminder type" }),
  // }),
});

// Tip koji se izvodi iz šeme za kreiranje
export type CreateContractReminderData = z.infer<typeof createContractReminderSchema>;


// Šema za validaciju podataka pri označavanju podsetnika kao pregledanog (acknowledge)
export const acknowledgeContractReminderSchema = z.object({
    reminderId: z.string().cuid("Invalid reminder ID format"), // ID podsetnika koji se pregleda
    // acknowledgedById se dobija iz sesije na serveru
});

// Tip koji se izvodi iz šeme za acknowledge
export type AcknowledgeContractReminderData = z.infer<typeof acknowledgeContractReminderSchema>;