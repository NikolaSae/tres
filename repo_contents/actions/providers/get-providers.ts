// /actions/providers/get-providers.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getProviders() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized access");
  }

  return db.provider.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      contactName: true,
      email: true,
      phone: true,
    },
  });
}