// /lib/contracts/revenue-calculator.ts
import { db } from '@/lib/db';
import { Contract, ServiceContract, VASService as PrismaVASService, BulkService as PrismaBulkService, ServiceType, Service } from '@prisma/client'; // Use aliases to avoid conflict with local types if any
import { startOfMonth, endOfMonth, max, min } from 'date-fns';

// Tipovi za uključene relacije
type ContractWithServicesAndProvider = Contract & {
    services: (ServiceContract & { service: { id: string, type: ServiceType, name: string } })[];
    provider: { id: string } | null; // Ensure provider is included for filtering VAS data
};

// Define the structure that calculateContractRevenue will return
interface CalculatedRevenueData {
    totalGrossRevenue: number; // Revenue before percentage split
    platformRevenue: number; // Revenue share for the platform
    partnerRevenue: number; // Revenue share for the partner
    serviceBreakdown: {
        id: string; // Service ID
        name: string; // Service Name
        revenueAmount: number; // Gross revenue from THIS service for THIS contract in the period
        percentage: number; // Percentage of THIS service's gross revenue vs total gross revenue
    }[];
}

/**
 * Kalkuliše podatke o prihodu za specifičan ugovor u datom vremenskom periodu,
 * vraćajući strukturu sa ukupnim iznosima i razradom po servisima.
 * @param contractId - ID ugovora za koji se kalkuliše prihod.
 * @param calculationStartDate - Početni datum perioda za kalkulaciju (podrazumevano početak ugovora).
 * @param calculationEndDate - Krajnji datum perioda za kalkulaciju (podrazumevano kraj ugovora).
 * @returns Objekat tipa CalculatedRevenueData ili null ako ugovor ne postoji.
 */
export const calculateContractRevenue = async (
    contractId: string,
    calculationStartDate?: Date,
    calculationEndDate?: Date
): Promise<CalculatedRevenueData | null> => {
    try {
        // 1. Dohvatanje ugovora sa potrebnim relacijama
        const contract = await db.contract.findUnique({
            where: { id: contractId },
            include: {
                services: {
                    include: {
                        service: {
                            select: { id: true, type: true, name: true }
                        }
                    },
                },
                provider: { select: { id: true } },
                humanitarianOrg: { select: { id: true } },
                parkingService: { select: { id: true } },
            },
        }) as ContractWithServicesAndProvider | null; // Cast to the specific included type

        if (!contract) {
            console.warn(`Contract with ID ${contractId} not found for revenue calculation.`);
            return null; // Vrati null ako ugovor ne postoji
        }

        // 2. Definisanje perioda kalkulacije
        const periodStart = calculationStartDate ? max([contract.startDate, calculationStartDate]) : contract.startDate;
        const periodEnd = calculationEndDate ? min([contract.endDate, calculationEndDate]) : contract.endDate;

        // Adjust periodEnd to the end of the day if it matches contractEndDate exactly
        // This ensures date comparisons work correctly if endDate is stored as start of day
        if (contract.endDate && periodEnd.getTime() === contract.endDate.getTime()) {
             periodEnd.setHours(23, 59, 59, 999);
        }
         // Adjust periodStart to the start of the day if it matches contractStartDate exactly
         if (contract.startDate && periodStart.getTime() === contract.startDate.getTime()) {
              periodStart.setHours(0, 0, 0, 0);
         }


        if (periodStart > periodEnd) {
             // Vrati strukturu sa 0 vrednostima ako se periodi ne preklapaju
            return {
                totalGrossRevenue: 0,
                platformRevenue: 0,
                partnerRevenue: 0,
                serviceBreakdown: [],
            };
        }

        let totalGrossRevenue = 0;
        const serviceRevenueMap: { [serviceId: string]: { name: string; amount: number } } = {};

        // 3. Iteracija kroz povezane servise i dohvatanje relevantnih podataka
        for (const serviceLink of contract.services) {
            const serviceId = serviceLink.serviceId;
            const serviceType = serviceLink.service.type;
            const serviceName = serviceLink.service.name;

            let serviceGrossRevenue = 0;

            if (serviceType === ServiceType.VAS && contract.providerId) {
                // FIX: Corrected db.vASService to db.vasService
                const vasData = await db.vasService.findMany({
                    where: {
                        serviceId: serviceId,
                        provajderId: contract.providerId,
                         mesec_pruzanja_usluge: {
                            // Filtering by month start/end might need adjustment
                            // depending on how mesec_pruzanja_usluge is stored (e.g., always 1st of month)
                            // and if you need revenue for parts of months.
                            // Current filter gte/lte start/end of period months is a reasonable approximation
                            gte: startOfMonth(periodStart),
                            lte: endOfMonth(periodEnd),
                         },
                    },
                    select: {
                        naplacen_iznos: true,
                    },
                });

                serviceGrossRevenue = vasData.reduce((sum, data) => sum + (data.naplacen_iznos || 0), 0);

            } else if (serviceType === ServiceType.BULK) {
                 // Placeholder logic for Bulk - needs implementation
                console.warn(`Bulk service "${serviceName}" attached to contract ${contract.contractNumber}. Revenue calculation for Bulk services over a period is not fully implemented.`);
                serviceGrossRevenue = 0; // Assume 0 for now until implemented with rates/dates
            }
            // Dodajte logiku za druge ServiceType ako postoje

            if (serviceGrossRevenue > 0) {
                 // Aggregate revenue per service ID
                if (!serviceRevenueMap[serviceId]) {
                    serviceRevenueMap[serviceId] = { name: serviceName, amount: 0 };
                }
                serviceRevenueMap[serviceId].amount += serviceGrossRevenue;
                totalGrossRevenue += serviceGrossRevenue;
            }
        }

        // 4. Formatiranje Service Breakdown i računanje procenata
        const serviceBreakdown = Object.keys(serviceRevenueMap).map(serviceId => {
             const service = serviceRevenueMap[serviceId];
             const percentage = totalGrossRevenue > 0 ? (service.amount / totalGrossRevenue) * 100 : 0;
             return {
                 id: serviceId,
                 name: service.name,
                 revenueAmount: service.amount,
                 percentage: percentage,
             };
        });


        // 5. Primena revenuePercentage ugovora za Platformu i Partnera
        const platformRevenue = totalGrossRevenue * (contract.revenuePercentage / 100);
        const partnerRevenue = totalGrossRevenue - platformRevenue; // Partner dobija ostatak

        // 6. Vraćanje kompletne strukture
        return {
            totalGrossRevenue: totalGrossRevenue, // Ukupno pre podele
            platformRevenue: platformRevenue,
            partnerRevenue: partnerRevenue,
            serviceBreakdown: serviceBreakdown,
        };

    } catch (error) {
        console.error(`Error calculating revenue for contract ${contractId}:`, error);
        // Vraćanje strukture sa 0 vrednostima u slučaju greške
        return {
             totalGrossRevenue: 0,
            platformRevenue: 0,
            partnerRevenue: 0,
            serviceBreakdown: [],
        };
    }
};

// calculateTotalPlatformRevenue is not used for this specific fix