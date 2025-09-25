"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getHumanitarianOrgs() {
  try {
    const session = await auth();
    if (!session?.user) {
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