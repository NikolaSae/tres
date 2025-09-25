////lib/providers.ts


import { db } from "@/lib/db";

/**
 * Fetches all unique providers from the database
 * @returns Array of unique providers with their id and name
 */
export async function getUniqueProviders() {
  try {
    const providers = await db.provider.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return providers.map(provider => ({
      id: provider.id,
      name: provider.name || provider.id
    }));
  } catch (error) {
    console.error("Error fetching unique providers:", error);
    return [];
  }
}