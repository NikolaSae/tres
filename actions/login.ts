// actions/login.ts 
"use server";

import * as z from "zod";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { loginSchema } from "@/schemas/auth";
import { getUserByEmail } from "@/data/user";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { sendVerificationEmail, sendTwoFactorTokenEmail } from "@/lib/mail";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { generateVerificationToken, generateTwoFactorToken } from "@/lib/tokens";
import { getTwoFactorConfoirmationByUserId } from "@/data/two-factor-confirmation";
import { rateLimit, RATE_LIMIT_CONFIGS } from "@/lib/security/rate-limiter";
import { logActivity } from "@/lib/security/audit-logger";
import { LogSeverity } from "@prisma/client";
import { NextRequest } from "next/server";

const loginWithCodeSchema = loginSchema.extend({
  code: z.string().optional(),
});

export const login = async (
  values: z.infer<typeof loginWithCodeSchema>,
  callbackUrl?: string | null
) => {
  const validatedFields = loginWithCodeSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, code } = validatedFields.data;

  // ✅ Rate limiting — po email adresi, 5 pokušaja / 15 minuta
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
    headersList.get("x-real-ip") ||
    "anonymous";

  const fakeReq = {
    headers: { get: (key: string) => headersList.get(key) },
  } as unknown as NextRequest;

  const rl = await rateLimit(fakeReq, `login:${email}`, RATE_LIMIT_CONFIGS.auth);
  if (!rl.success) {
    await logActivity("LOGIN_RATE_LIMITED", {
      entityType: "auth",
      details: { email, ip },
      severity: LogSeverity.WARNING,
    }).catch(() => {});
    return { error: "Previše neuspešnih pokušaja. Pokušajte ponovo za 15 minuta." };
  }

  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    // ✅ Ne otkrivamo da li user postoji — isti odgovor kao za pogrešnu lozinku
    await logActivity("LOGIN_FAILED", {
      entityType: "auth",
      details: { ip, reason: "user_not_found" },
      severity: LogSeverity.WARNING,
    }).catch(() => {});
    return { error: "Invalid credentials!" };
  }

  if (existingUser.isActive === false) {
    await logActivity("LOGIN_FAILED", {
      entityType: "auth",
      entityId: existingUser.id,
      details: { ip, reason: "account_inactive" },
      severity: LogSeverity.WARNING,
    }).catch(() => {});
    return { error: "Account is deactivated!" };
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(existingUser.email);
    await sendVerificationEmail(verificationToken.email, verificationToken.token);
    return { success: "Confirmation email sent!" };
  }

  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    if (code) {
      const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email);

      if (!twoFactorToken || twoFactorToken.token !== code) {
        await logActivity("LOGIN_FAILED", {
          entityType: "auth",
          entityId: existingUser.id,
          details: { ip, reason: "invalid_2fa_code" },
          severity: LogSeverity.WARNING,
        }).catch(() => {});
        return { error: "Invalid code!" };
      }

      const hasExpired = new Date(twoFactorToken.expires) < new Date();
      if (hasExpired) {
        return { error: "Code expired!" };
      }

      await db.twoFactorToken.delete({ where: { id: twoFactorToken.id } });

      const existingConfirmation = await getTwoFactorConfoirmationByUserId(existingUser.id);
      if (existingConfirmation) {
        await db.twoFactorConfirmation.delete({ where: { id: existingUser.id } });
      }

      await db.twoFactorConfirmation.create({
        data: { userId: existingUser.id },
      });
    } else {
      const twoFactorToken = await generateTwoFactorToken(existingUser.email);
      await sendTwoFactorTokenEmail(twoFactorToken.email, twoFactorToken.token);
      return { twoFactor: true };
    }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || DEFAULT_LOGIN_REDIRECT,
    });

    // ✅ Loguj uspešan login
    await logActivity("LOGIN_SUCCESS", {
      entityType: "auth",
      entityId: existingUser.id,
      details: { ip },
      severity: LogSeverity.INFO,
    }).catch(() => {});

  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("CredentialsSignin") ||
        error.message.includes("Invalid credentials")
      ) {
        await logActivity("LOGIN_FAILED", {
          entityType: "auth",
          entityId: existingUser.id,
          details: { ip, reason: "invalid_credentials" },
          severity: LogSeverity.WARNING,
        }).catch(() => {});
        return { error: "Invalid credentials!" };
      }
    }
    // NextAuth redirect — re-throw (ovo je normalan flow za uspešan login)
    throw error;
  }
};

export async function logoutAction() {
  await signOut({ redirectTo: "/auth/login" });
}