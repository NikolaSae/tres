///actions/password.ts
"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";

import { newPasswordSchema } from "@/schemas"; // Changed to lowercase
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";

export const newPassword = async (
  values: z.infer<typeof newPasswordSchema>, // Changed to lowercase
  token?: string | null
) => {
  if (!token) {
    return { error: "Missing token!" };
  }

  const validatedFields = newPasswordSchema.safeParse(values); // Changed to lowercase

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
    };
  }

  const { password } = validatedFields.data;

  const existingToken = await getPasswordResetTokenByToken(token);

  if (!existingToken) {
    return {
      error: "Invalid token!",
    };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return {
      error: "Token has expired!",
    };
  }

  const existingUser = await getUserByEmail(existingToken.email); // Fixed typo: exitingUser -> existingUser

  if (!existingUser) { // Fixed typo: exitingUser -> existingUser
    return {
      error: "User not found!",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.update({
    where: { id: existingUser.id }, // Fixed typo: exitingUser -> existingUser
    data: {
      password: hashedPassword,
    },
  });

  await db.passwordResetToken.delete({
    where: { id: existingToken.id },
  });

  return {
    success: "Password updated!",
  };
};