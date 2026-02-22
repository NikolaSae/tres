//actions/reset.ts
"use server";

import * as z from "zod";
import { headers } from "next/headers";
import { ResetSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { sendPasswordResetEmail } from "@/lib/mail";
import { generatePasswordResetToken } from "@/lib/tokens";
import { rateLimit, RATE_LIMIT_CONFIGS } from "@/lib/security/rate-limiter";
import { logActivity } from "@/lib/security/audit-logger";
import { LogSeverity } from "@prisma/client";
import { NextRequest } from "next/server";

export const reset = async (values: z.infer<typeof ResetSchema>) => {
  const validatedFields = ResetSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid email!" };
  }

  const { email } = validatedFields.data;

  // ✅ Rate limiting — sprečava spam reset emailova
  // Isti limit kao auth: 5 pokušaja / 15 minuta
  const headersList = await headers();
  const fakeReq = {
    headers: { get: (key: string) => headersList.get(key) },
  } as unknown as NextRequest;

  const rl = await rateLimit(fakeReq, `reset:${email}`, RATE_LIMIT_CONFIGS.auth);
  if (!rl.success) {
    // ✅ Isti generički odgovor — ne otkrivamo da li je rate limited
    return { success: "If that email exists, a reset link has been sent." };
  }

  const existingUser = await getUserByEmail(email);

  // ✅ FIX: User enumeration ranjivost uklonjena
  // Stari kod: if (!existingUser) return { error: "User not found!" }
  // Napadač je mogao da enumeruje postojeće emailove
  // Novi kod: uvek vraćamo isti generički odgovor
  if (!existingUser) {
    await logActivity("PASSWORD_RESET_REQUESTED", {
      entityType: "auth",
      details: { email, found: false },
      severity: LogSeverity.INFO,
    }).catch(() => {});

    // Generički odgovor — ne otkrivamo da user ne postoji
    return { success: "If that email exists, a reset link has been sent." };
  }

  const passwordResetToken = await generatePasswordResetToken(email);
  await sendPasswordResetEmail(passwordResetToken.email, passwordResetToken.token);

  await logActivity("PASSWORD_RESET_REQUESTED", {
    entityType: "auth",
    entityId: existingUser.id,
    details: { email, found: true },
    severity: LogSeverity.INFO,
  }).catch(() => {});

  return { success: "If that email exists, a reset link has been sent." };
};