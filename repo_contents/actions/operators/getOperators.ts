// Path: actions/operators/getOperators.ts
'use server';

import { db } from "@/lib/db";
// Uvezite Operator tip ako je definisan u types fajlu
import { Operator } from "@prisma/client"; // Ili direktno iz Prisme ako ga koristite

// Definirajte tip za parametre, slično kao u page.tsx
interface GetOperatorsParams {
  search?: string;
  active?: "all" | "active" | "inactive";
  sortBy?: "name" | "code" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

/**
 * Dohvata listu operatora sa opcijama filtriranja, sortiranja i paginacije.
 * @param params Objekat sa parametrima za pretragu, status, sortiranje i paginaciju.
 * @returns Objekat sa listom operatora, ukupnim brojem, brojem stranica i trenutnom stranicom.
 */
export async function getOperators(params: GetOperatorsParams) {
  try {
    const {
      search = "",
      active = "all",
      sortBy = "name",
      sortOrder = "asc",
      page = 1,
      pageSize = 10
    } = params;

    // Build where clause for filtering
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        // Možda dodajte i druga polja za pretragu ako je potrebno
         { description: { contains: search, mode: "insensitive" } },
         { contactEmail: { contains: search, mode: "insensitive" } },
         { contactPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (active !== "all") {
      where.active = active === "active";
    }

    // Get total count of operators matching the filters
    const totalCount = await db.operator.count({ where });

    // Calculate pagination parameters
    const skip = (page - 1) * pageSize;
    const pageCount = Math.ceil(totalCount / pageSize);

    // Ensure skip is not negative
    const safeSkip = Math.max(0, skip);


    // Get operators with contract count, applying filtering, sorting, and pagination
    const operators = await db.operator.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: safeSkip, // Koristite safeSkip
      take: pageSize,
      select: {
        id: true,
        name: true,
        code: true,
        contactEmail: true,
        contactPhone: true,
        active: true,
        createdAt: true, // Dodajte createdAt za sortiranje
        // Uključite website ako je potrebno za prikaz u listi
         website: true,
        _count: {
          select: {
            contracts: true,
          },
        },
      },
    });

    // Transform data for response if needed (e.g., add contractCount directly)
    const formattedOperators = operators.map(op => ({
      id: op.id,
      name: op.name,
      code: op.code,
      contactEmail: op.contactEmail,
      contactPhone: op.contactPhone,
      active: op.active,
      createdAt: op.createdAt, // Uključite createdAt
       website: op.website, // Uključite website ako je selektovan iznad
      contractCount: op._count.contracts,
    }));

    console.log(`[getOperators] Fetched ${formattedOperators.length} operators (Total: ${totalCount})`);

    return {
      operators: formattedOperators, // Vratite niz operatora
      totalCount,
      pageCount,
      currentPage: page,
    };
  } catch (error) {
    console.error("[getOperators] Error fetching operators:", error);
    // Baca grešku da bi je roditeljska komponenta mogla uhvatiti ili da bi se prikazao fallback
    throw new Error("Failed to fetch operators");
  }
}
