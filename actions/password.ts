///actions/password.ts
"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { newPasswordSchema } from "@/schemas";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";
import { rateLimit, RATE_LIMIT_CONFIGS } from "@/lib/security/rate-limiter";
import { logActivity } from "@/lib/security/audit-logger";
import { LogSeverity } from "@prisma/client";
import { NextRequest } from "next/server";

export const newPassword = async (
  values: z.infer<typeof newPasswordSchema>,
  token?: string | null
) => {
  if (!token || typeof token !== "string" || token.length > 512) {
    return { error: "Missing token!" };
  }

  // ✅ Rate limiting — sprečava brute-force token guessing
  const headersList = await headers();
  const fakeReq = {
    headers: { get: (key: string) => headersList.get(key) },
  } as unknown as NextRequest;

  const rl = await rateLimit(
    fakeReq,
    `newpassword:${token.slice(0, 16)}`,
    RATE_LIMIT_CONFIGS.auth
  );
  if (!rl.success) {
    return { error: "Previše pokušaja. Zatražite novi reset link." };
  }

  const validatedFields = newPasswordSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { password } = validatedFields.data;

  const existingToken = await getPasswordResetTokenByToken(token);
  if (!existingToken) {
    return { error: "Invalid token!" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    // ✅ Obriši istekli token iz baze
    await db.passwordResetToken.delete({ where: { id: existingToken.id } }).catch(() => {});
    return { error: "Token has expired!" };
  }

  const existingUser = await getUserByEmail(existingToken.email);
  if (!existingUser) {
    return { error: "User not found!" };
  }

  // ✅ Proveri da nova lozinka nije ista kao stara
  if (existingUser.password) {
    const isSamePassword = await bcrypt.compare(password, existingUser.password);
    if (isSamePassword) {
      return { error: "Nova lozinka mora biti različita od stare!" };
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12); // ✅ 12 rounds umesto 10

  await db.user.update({
    where: { id: existingUser.id },
    data: { password: hashedPassword },
  });

  // ✅ Obriši token nakon uspešne promene (single-use)
  await db.passwordResetToken.delete({ where: { id: existingToken.id } });

  await logActivity("PASSWORD_RESET_COMPLETED", {
    entityType: "auth",
    entityId: existingUser.id,
    severity: LogSeverity.INFO,
  }).catch(() => {});

  return { success: "Password updated!" };
};