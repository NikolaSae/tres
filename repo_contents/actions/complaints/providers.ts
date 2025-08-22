///actions/complaints/providers.ts


"use server";

import { db } from "@/lib/db";

interface ProviderData {
  id: string;
  name: string;
}

export async function getProviders(): Promise<ProviderData[]> {
  try {
    const providers = await db.provider.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });
    console.log("Successfully fetched providers for form:", providers.length, "items");
    return providers;
  } catch (error) {
    console.error("Error fetching providers for form:", error);
    return [];
  }
}