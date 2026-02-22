// Path: actions/complaints/humanitarian.ts
"use server";
import { db } from "@/lib/db";

export async function getHumanitarianOrgs() {
  try {
    return await db.humanitarianOrg.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching humanitarian organizations:", error);
    return [];
  }
}