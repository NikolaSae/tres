// Path: actions/complaints/humanitarian.ts

import { db } from "@/lib/db";

/**
 * Fetches all humanitarian organizations
 * @returns Array of humanitarian organizations with id and name
 */
export async function getHumanitarianOrgs() {
  try {
    const organizations = await db.humanitarianOrg.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return organizations;
  } catch (error) {
    console.error("Error fetching humanitarian organizations:", error);
    return [];
  }
}