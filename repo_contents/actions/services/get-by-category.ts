// /actions/services/get-by-category.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ServiceType } from "@prisma/client";

export async function getServicesByCategory(type?: ServiceType) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized access");
  }

  const where = type ? { type, isActive: true } : { isActive: true };

  return db.service.findMany({
    where,
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      type: true,
      description: true,
    },
  });
}