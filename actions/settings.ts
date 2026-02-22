// actions/settings.ts
"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { SettingsSchema } from "@/schemas";
import { getUserByEmail, getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { logActivity } from "@/lib/security/audit-logger";
import { LogSeverity } from "@prisma/client";

export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  const user = await currentUser();
  if (!user?.id) {
    return { error: "Unauthorized" };
  }

  const dbUser = await getUserById(user.id);
  if (!dbUser) {
    return { error: "Unauthorized" };
  }

  // OAuth korisnici ne mogu da menjaju email/lozinku
  if (user.isOAuth) {
    values.email = undefined;
    values.password = undefined;
    values.newPassword = undefined;
    values.isTwoFactorEnabled = undefined;
  }

  // Promena email adrese
  if (values.email && values.email !== user.email) {
    const existingUser = await getUserByEmail(values.email);
    if (existingUser && existingUser.id !== user.id) {
      return { error: "Email already in use!" };
    }

    const verificationToken = await generateVerificationToken(values.email);
    await sendVerificationEmail(verificationToken.email, verificationToken.token);

    await logActivity("EMAIL_CHANGE_REQUESTED", {
      entityType: "user",
      entityId: user.id,
      details: { newEmail: values.email },
      severity: LogSeverity.INFO,
    }).catch(() => {});

    return { success: "Verification email sent!" };
  }

  // Promena lozinke
  if (values.password && values.newPassword && dbUser.password) {
    const passwordMatch = await bcrypt.compare(values.password, dbUser.password);
    if (!passwordMatch) {
      return { error: "Incorrect password!" };
    }

    // ✅ BUG FIX: Stari kod hashuje values.password (stara lozinka!)
    // umesto values.newPassword (nova lozinka)
    // Korisnik misli da je promenio lozinku, a stara ostaje aktivna
    const hashedNewPassword = await bcrypt.hash(values.newPassword, 12); // ✅ 12 rounds

    await db.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    await logActivity("PASSWORD_CHANGED", {
      entityType: "user",
      entityId: user.id,
      severity: LogSeverity.INFO,
    }).catch(() => {});

    // Ukloni lozinke iz values pre update ostalih polja
    values.password = undefined;
    values.newPassword = undefined;
  }

  // ✅ Ukloni undefined vrednosti pre update da ne prepiše polja sa null
  const updateData = Object.fromEntries(
    Object.entries(values).filter(([_, v]) => v !== undefined)
  );

  await db.user.update({
    where: { id: user.id },
    data: updateData,
  });

  await logActivity("SETTINGS_UPDATED", {
    entityType: "user",
    entityId: user.id,
    details: { fields: Object.keys(updateData) },
    severity: LogSeverity.INFO,
  }).catch(() => {});

  return { success: "Settings Updated!" };
};