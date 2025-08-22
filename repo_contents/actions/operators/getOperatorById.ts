// Path: actions/operators/getOperatorById.ts
'use server';

import { db } from "@/lib/db";
import { Operator } from "@prisma/client"; // Uvezite Operator tip iz Prisme

/**
 * Dohvata detalje operatera po ID-u.
 * Uključuje povezane ugovore i njihov broj.
 * @param id ID operatera.
 * @returns Objekat operatera sa uključenim ugovorima i brojem ugovora.
 * @throws Error ako operater nije pronađen ili dođe do greške pri dohvatanju.
 */
export async function getOperatorById(id: string) {
  try {
    // Dohvatite operatera po jedinstvenom ID-u
    const operator = await db.operator.findUnique({
      where: {
        id, // Filtrirajte po prosleđenom ID-u
      },
      include: {
        // Uključite povezane ugovore
        contracts: {
          select: {
            id: true,
            name: true,
            contractNumber: true,
            startDate: true,
            endDate: true,
            revenuePercentage: true,
            operatorRevenue: true,
            status: true, // Dodajte status ugovora ako je potreban
          },
          orderBy: {
              endDate: 'desc', // Sortirajte ugovore po datumu završetka
          }
        },
        // Uključite broj povezanih ugovora
        _count: {
          select: {
            contracts: true,
          },
        },
      },
    });

    // Ako operater nije pronađen, bacite grešku
    if (!operator) {
      console.warn(`[getOperatorById] Operator with ID ${id} not found.`);
      throw new Error("Operator not found");
    }

    console.log(`[getOperatorById] Fetched operator: ${operator.name} (${operator.id})`);

    // Vratite pronađenog operatera sa uključenim podacima
    return operator;
  } catch (error) {
    console.error(`[getOperatorById] Error fetching operator with ID ${id}:`, error);
    // Re-bacite grešku ili bacite novu standardizovanu grešku
    throw new Error("Failed to fetch operator details");
  }
}
