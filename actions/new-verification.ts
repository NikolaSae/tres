//actions/new-verification.ts
"use server";

import { db } from "@/lib/db";
import { headers } from "next/headers";
import { getUserByEmail } from "@/data/user";
import { getVerificationTokenByToken } from "@/data/verification-token";
import { rateLimit, RATE_LIMIT_CONFIGS } from "@/lib/security/rate-limiter";
import { NextRequest } from "next/server";

export const newVerification = async (token: string) => {
  // ✅ Osnovna validacija tokena pre svega
  if (!token || typeof token !== "string" || token.length > 512) {
    return { error: "Token does not exist!" };
  }

  // ✅ Rate limiting po tokenu — sprečava brute-force token guessing
  const headersList = await headers();
  const fakeReq = {
    headers: { get: (key: string) => headersList.get(key) },
  } as unknown as NextRequest;

  const rl = await rateLimit(fakeReq, `verify:${token.slice(0, 16)}`, RATE_LIMIT_CONFIGS.auth);
  if (!rl.success) {
    return { error: "Previše pokušaja. Zatražite novi verifikacioni link." };
  }

  const existingToken = await getVerificationTokenByToken(token);
  if (!existingToken) {
    return { error: "Token does not exist!" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    // ✅ Obriši istekli token da ne zauzima prostor
    await db.verificationToken.delete({ where: { id: existingToken.id } }).catch(() => {});
    return { error: "Token has expired!" };
  }

  const existingUser = await getUserByEmail(existingToken.email);
  if (!existingUser) {
    return { error: "Email does not exist!" };
  }

  await db.user.update({
    where: { id: existingUser.id },
    data: {
      emailVerified: new Date(),
      email: existingToken.email,
    },
  });

  await db.verificationToken.delete({ where: { id: existingToken.id } });

  return { success: "Email verified!" };
};