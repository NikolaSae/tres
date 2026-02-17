// actions/organizations/get-humanitarian.ts
"use server";

import { db } from "@/lib/db";

// ✅ Prima userId kao argument
export async function getHumanitarianOrgs(userId: string) {
  try {
    if (!userId) {
      throw new Error("Unauthorized access");
    }

    const organizations = await db.humanitarianOrg.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
        address: true,
        website: true,
      },
      where: {
        isActive: true,
      },
    });

    return organizations;
  } catch (error) {
    console.error("Error fetching humanitarian organizations:", error);
    throw error;
  }
}