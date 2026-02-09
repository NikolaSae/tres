// actions/security/get-distinct-entity-types.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

export async function getDistinctEntityTypes() {
  try {
    const session = await auth();

    if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return [];
    }

    const distinctTypes = await db.activityLog.findMany({
      select: {
        entityType: true,
      },
      distinct: ['entityType'],
      where: {
        // Ispravljeno: koristi isNot: null za isključivanje null vrednosti
        entityType: { isNot: null },
      },
    });

    const entityTypes = distinctTypes
      .map(log => log.entityType)
      .filter((type): type is string => type !== null); // Type guard za sigurnost

    return entityTypes;
  } catch (error) {
    console.error("[GET_DISTINCT_ENTITY_TYPES_ACTION_ERROR]", error);
    return [];
  }
}