// actions/complaints/providers.ts
"use server";
import { db } from "@/lib/db";

interface ProviderData {
  id: string;
  name: string;
  type: "VAS" | "BULK"; // ✅ Samo VAS ili BULK
}

export async function getProviders(): Promise<ProviderData[]> {
  try {
    const providers = await db.provider.findMany({
      select: {
        id: true,
        name: true,
        vasServices: {
          select: { id: true },
          take: 1,
        },
        bulkServices: {
          select: { id: true },
          take: 1,
        },
      },
      where: {
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    const providersWithType: ProviderData[] = providers.map(provider => {
      const hasVasServices = provider.vasServices.length > 0;
      const hasBulkServices = provider.bulkServices.length > 0;

      // ✅ Ako ima VAS servise, prioritet je VAS
      // Ako nema VAS ali ima BULK, onda BULK
      return {
        id: provider.id,
        name: provider.name,
        type: hasVasServices ? "VAS" : "BULK",
      };
    });

    console.log("Successfully fetched providers for form:", providersWithType.length, "items");
    return providersWithType;
  } catch (error) {
    console.error("Error fetching providers for form:", error);
    return [];
  }
}