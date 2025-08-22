// /lib/services/statistics.ts
// Utility funkcije za izračunavanje statistika vezanih za servise i proizvode

import { db } from '@/lib/db'; // Pretpostavljena putanja do vašeg Prisma klijenta
// Uvozimo tipove ako su potrebni za ulazne parametre ili povratne vrednosti
import { Service, Product } from '@prisma/client';
// import { ServiceCategory } from '@/lib/types/service-types'; // Ako je potrebno filtrirati po kategoriji

// Primer: Tip za sumarni prikaz prihoda po servisu/proizvodu
interface RevenueSummary {
    id: string;
    name: string;
    totalRevenue: number; // Ukupni prihodi povezani sa ovim entitetom
    contractsCount: number; // Broj povezanih ugovora
}

// Primer: Tip za prosečnu cenu reklamacija po servisu/proizvodu
interface ComplaintCostSummary {
    id: string;
    name: string;
    averageCost: number;
    totalComplaints: number;
}

/**
 * Izračunava sumu prihoda za date servise na osnovu povezanih ugovora.
 * @param serviceIds - Niz ID-jeva servisa za koje se računaju prihodi.
 * @returns Niz objekata RevenueSummary za svaki servis.
 */
export async function getServiceRevenueSummary(serviceIds: string[]): Promise<RevenueSummary[]> {
    // U realnoj aplikaciji, ova funkcija bi pristupala bazi (Prisma)
    // i agregirala podatke iz povezanih ugovora (model Contract).
    // Ugovori bi trebalo da imaju relaciju ka Servisima (npr. Service.contracts)
    // i verovatno polja kao što je revenuePercentage ili fiksni iznos prihoda.

    try {
         // Primer Prisma upita za dohvatanje servisa sa brojačem povezanih ugovora
         // i izračunavanjem sume prihoda (ovo može biti kompleksno, zavisno od šeme ugovora)
         const servicesWithRevenue = await db.service.findMany({
             where: {
                 id: { in: serviceIds },
                 isActive: true, // Možda samo aktivni servisi?
             },
             select: {
                 id: true,
                 name: true,
                 _count: {
                     select: { contracts: true } // Broj povezanih ugovora
                 },
                 // Za stvarno računanje prihoda, treba fetchovati i agrirati podatke iz ugovora
                 // To bi zahtevalo složeniji upit sa .aggregate ili ručnom agregacijom
                 // na fetchovanim ugovorima. Primer:
                 contracts: {
                     select: {
                          // Polja ugovora potrebna za računanje prihoda
                          id: true,
                          revenuePercentage: true, // Ako ugovor ima procenat
                          // fixedRevenueAmount: true, // Ako ugovor ima fiksni iznos
                          // ... polja za datume ako se računaju prihodi u periodu
                     },
                     where: {
                         // Dodatni filteri za ugovore ako su potrebni (npr. aktivni ugovori)
                         status: { in: ['ACTIVE', 'COMPLETED'] } // Primer
                     }
                 }
             }
         });

         // Ručna agregacija prihoda ako Prisma .aggregate nije dovoljan
         const revenueSummary: RevenueSummary[] = servicesWithRevenue.map(service => {
              let totalRevenue = 0;
              // Agregirati prihode iz service.contracts liste
              service.contracts.forEach(contract => {
                  // Primer: Ako prihod zavisi od percentage i ukupne vrednosti ugovora (koja ovde nije fetchovana)
                  // Ili ako je prihod fiksni iznos ugovora ili stavke ugovora
                  // Ovo je kompleksna logika koja zavisi od vaše šeme
                   // totalRevenue += calculateContractRevenue(contract); // Potrebna pomoćna funkcija
              });

             return {
                 id: service.id,
                 name: service.name,
                 totalRevenue: totalRevenue, // Implementirati stvarnu agregaciju
                 contractsCount: service._count?.contracts ?? 0,
             };
         });

         return revenueSummary;

    } catch (error) {
        console.error("Error calculating service revenue summary:", error);
        throw new Error("Failed to calculate service revenue summary.");
    }
}

/**
 * Izračunava statistike o reklamacijama za date proizvode.
 * @param productIds - Niz ID-jeva proizvoda.
 * @returns Niz objekata ComplaintCostSummary za svaki proizvod.
 */
export async function getProductComplaintStats(productIds: string[]): Promise<ComplaintCostSummary[]> {
    // Slično kao i za prihode, ovo bi uključivalo pristup bazi (Prisma)
    // i rad sa modelom Complaint, koji bi trebalo da ima relaciju ka Proizvodima.
    // Model Complaint bi možda imao polje za trošak ili procenjenu štetu.

     try {
          // Primer: Dohvatanje proizvoda sa povezanim reklamacijama
          const productsWithComplaints = await db.product.findMany({
              where: {
                  id: { in: productIds },
                  isActive: true,
              },
              select: {
                  id: true,
                  name: true,
                   _count: {
                       select: { complaints: true }
                   },
                  complaints: {
                       select: {
                            // Polja reklamacije potrebna za statistiku (npr. cost, status)
                           id: true,
                            estimatedCost: true, // Ako postoji polje za trošak
                           status: true, // Možda samo zatvorene reklamacije?
                       },
                       where: {
                           // Dodatni filteri za reklamacije
                           // status: { in: ['CLOSED', 'RESOLVED'] } // Primer
                       }
                   }
              }
          });

          // Ručna agregacija statistika reklamacija
          const complaintStats: ComplaintCostSummary[] = productsWithComplaints.map(product => {
               let totalCost = 0;
               let validComplaintsCount = 0; // Broj reklamacija uključenih u prosek/sumu

               product.complaints.forEach(complaint => {
                    // Primer: sabiranje procenjenog troška samo za zatvorene reklamacije
                    // if (complaint.status === 'CLOSED' && complaint.estimatedCost !== null) {
                         // totalCost += complaint.estimatedCost;
                         // validComplaintsCount++;
                    // }
               });

               const averageCost = validComplaintsCount > 0 ? totalCost / validComplaintsCount : 0;

               return {
                   id: product.id,
                   name: product.name,
                   averageCost: averageCost,
                   totalComplaints: product._count?.complaints ?? 0, // Ukupan broj reklamacija (ili validComplaintsCount)
               };
          });

          return complaintStats;

     } catch (error) {
         console.error("Error calculating product complaint stats:", error);
         throw new Error("Failed to calculate product complaint stats.");
     }
}


// Dodajte druge funkcije za statistiku po potrebi, npr:
// export async function getServiceUsageTrends(serviceId: string, period: 'monthly' | 'quarterly'): Promise<any> { ... }
// export async function getProductsPerServiceCategory(category: ServiceCategory): Promise<any> { ... }