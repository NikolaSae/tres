// actions/login.ts - Fixed version
"use server";

import * as z from "zod";
import { AuthError } from "next-auth";

import { db } from "@/lib/db";
import { signIn } from "@/auth";
import { loginSchema } from "@/schemas/auth";
import { getUserByEmail } from "@/data/user";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { sendVerificationEmail, sendTwoFactorTokenEmail } from "@/lib/mail";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import {
  generateVerificationToken,
  generateTwoFactorToken,
} from "@/lib/tokens";
import { getTwoFactorConfoirmationByUserId } from "@/data/two-factor-confirmation";

// Extended schema that includes optional code for 2FA
const loginWithCodeSchema = loginSchema.extend({
  code: z.string().optional(),
});

export const login = async (
  values: z.infer<typeof loginWithCodeSchema>,
  callbackUrl?: string | null
) => {
  console.log("🔐 Login attempt:", { email: values.email, hasCode: !!values.code });

  const validatedFields = loginWithCodeSchema.safeParse(values);

  if (!validatedFields.success) {
    console.log("❌ Validation failed:", validatedFields.error);
    return { error: "Invalid fields!" };
  }

  const { email, password, code } = validatedFields.data;

  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    console.log("❌ User not found:", email);
    return {
      error: "Email does not exist!",
    };
  }

  console.log("👤 User found:", { 
    id: existingUser.id, 
    email: existingUser.email, 
    emailVerified: !!existingUser.emailVerified,
    isActive: existingUser.isActive,
    isTwoFactorEnabled: existingUser.isTwoFactorEnabled 
  });

  // Check if user is active
  if (existingUser.isActive === false) {
    console.log("❌ User is inactive");
    return { error: "Account is deactivated!" };
  }

  if (!existingUser.emailVerified) {
    console.log("📧 Email not verified, sending verification email");
    const verificationToken = await generateVerificationToken(
      existingUser.email
    );

    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );

    return {
      success: "Confirmation email sent!",
    };
  }

  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    if (code) {
      console.log("🔢 Verifying 2FA code");
      const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email);

      if (!twoFactorToken || twoFactorToken.token !== code) {
        console.log("❌ Invalid 2FA code");
        return { error: "Invalid code!" };
      }

      const hasExpired = new Date(twoFactorToken.expires) < new Date();

      if (hasExpired) {
        console.log("❌ 2FA code expired");
        return { error: "Code expired!" };
      }

      await db.twoFactorToken.delete({
        where: { id: twoFactorToken.id },
      });

      const existingConfirmation = await getTwoFactorConfoirmationByUserId(
        existingUser.id
      );

      if (existingConfirmation) {
        await db.twoFactorConfirmation.delete({
          where: { id: existingUser.id },
        });
      }

      await db.twoFactorConfirmation.create({
        data: {
          userId: existingUser.id,
        },
      });
    } else {
      console.log("📱 Generating 2FA token");
      const twoFactorToken = await generateTwoFactorToken(existingUser.email);

      await sendTwoFactorTokenEmail(twoFactorToken.email, twoFactorToken.token);

      return {
        twoFactor: true,
      };
    }
  }

  try {
    console.log("🚀 Attempting signIn");
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || DEFAULT_LOGIN_REDIRECT,
    });
    console.log("✅ SignIn successful");
  } catch (error) {
    console.error("❌ SignIn error:", error);
    
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }

    throw error;
  }
};

export async function logoutAction() {
  await signOut({ redirectTo: "/auth/login" });
}

// Alternative simple login function
export async function simpleLogin(email: string, password: string) {
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { 
      success: false, 
      error: error instanceof AuthError ? "Invalid credentials" : "Login failed" 
    };
  }
}