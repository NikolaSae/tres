// actions/complaints/providers.ts
"use server";
import { db } from "@/lib/db";

interface ProviderData {
  id: string;
  name: string;
  type: "VAS" | "BULK";
}

export async function getProviders(): Promise<ProviderData[]> {
  try {
    const providers = await db.provider.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        vasServices: { select: { id: true }, take: 1 },
        bulkServices: { select: { id: true }, take: 1 },
      },
      orderBy: { name: "asc" },
    });

    return providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      type: provider.vasServices.length > 0 ? "VAS" : "BULK",
    }));
  } catch (error) {
    console.error("Error fetching providers for form:", error);
    return [];
  }
}