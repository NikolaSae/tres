// lib/contracts/revenue-calculator.ts
import { db } from '@/lib/db';
import { Contract, ServiceContract, ServiceType } from '@prisma/client';
import { startOfMonth, endOfMonth, max, min } from 'date-fns';

type ContractWithServicesAndProvider = Contract & {
    services: (ServiceContract & { service: { id: string, type: ServiceType, name: string } })[];
    provider: { id: string } | null;
    parkingService: { id: string } | null;
};

interface ServiceBreakdownItem {
    id: string;
    name: string;
    revenueAmount: number;
    percentage: number;
    details?: {
        messages: number;
        messageRevenue: number;
        records: number;
        recordRevenue: number;
    };
}

interface CalculatedRevenueData {
    totalGrossRevenue: number;
    platformRevenue: number;
    partnerRevenue: number;
    serviceBreakdown: ServiceBreakdownItem[];
}

export const calculateContractRevenue = async (
    contractId: string,
    calculationStartDate?: Date,
    calculationEndDate?: Date
): Promise<CalculatedRevenueData | null> => {
    try {
        // Get contract with necessary relations
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
        }) as ContractWithServicesAndProvider | null;

        if (!contract) {
            console.warn(`Contract with ID ${contractId} not found`);
            return null;
        }

        // Define calculation period
        const periodStart = calculationStartDate 
            ? max([contract.startDate, calculationStartDate]) 
            : contract.startDate;
            
        const periodEnd = calculationEndDate 
            ? min([contract.endDate, calculationEndDate]) 
            : contract.endDate;

        // Adjust date boundaries
        const adjustedStart = new Date(periodStart);
        const adjustedEnd = new Date(periodEnd);
        
        adjustedStart.setHours(0, 0, 0, 0);
        adjustedEnd.setHours(23, 59, 59, 999);

        if (adjustedStart > adjustedEnd) {
            return {
                totalGrossRevenue: 0,
                platformRevenue: 0,
                partnerRevenue: 0,
                serviceBreakdown: [],
            };
        }

        let totalGrossRevenue = 0;
        const serviceRevenueMap = new Map<string, {
            name: string;
            amount: number;
            details?: {
                messages: number;
                messageRevenue: number;
                records: number;
                recordRevenue: number;
            }
        }>();

        // Handle parking contracts
        if (contract.type === "PARKING" && contract.parkingService?.id) {
            // Get service IDs associated with this contract
            const serviceIds = contract.services.map(sc => sc.serviceId);
            
            // Get parking transactions for services in this contract
            const parkingTransactions = await db.parkingTransaction.findMany({
                where: {
                    serviceId: { in: serviceIds },
                    parkingServiceId: contract.parkingService.id,
                    date: {
                        gte: adjustedStart,
                        lte: adjustedEnd,
                    },
                },
                select: {
                    amount: true,
                    serviceId: true,
                    service: {
                        select: {
                            name: true
                        }
                    }
                },
            });

            // Sum revenue per service
            for (const transaction of parkingTransactions) {
                const serviceId = transaction.serviceId;
                const serviceName = transaction.service?.name || "Unknown Service";
                
                if (!serviceRevenueMap.has(serviceId)) {
                    serviceRevenueMap.set(serviceId, {
                        name: serviceName,
                        amount: 0
                    });
                }
                
                const current = serviceRevenueMap.get(serviceId)!;
                current.amount += transaction.amount || 0;
                totalGrossRevenue += transaction.amount || 0;
            }
        } else {
            // Handle other contract types (VAS, BULK, etc.)
            for (const serviceLink of contract.services) {
                const serviceId = serviceLink.serviceId;
                const serviceType = serviceLink.service.type;
                const serviceName = serviceLink.service.name;

                let serviceGrossRevenue = 0;

                if (serviceType === "VAS" && contract.providerId) {
                    const vasData = await db.vasTransaction.findMany({
                        where: {
                            serviceId: serviceId,
                            providerId: contract.providerId,
                            date: {
                                gte: adjustedStart,  // ✅ Koristiti adjustedStart umesto startOfMonth
                                lte: adjustedEnd,    // ✅ Koristiti adjustedEnd umesto endOfMonth
                            },
                        },
                    });

                    serviceGrossRevenue = vasData.reduce(
                        (sum, data) => sum + (data.amount || 0), 
                        0
                    );
                    
                    // ✅ DODANO: Dodavanje u serviceRevenueMap
                    if (serviceGrossRevenue > 0) {
                        totalGrossRevenue += serviceGrossRevenue;
                        
                        if (serviceRevenueMap.has(serviceId)) {
                            const existing = serviceRevenueMap.get(serviceId)!;
                            existing.amount += serviceGrossRevenue;
                        } else {
                            serviceRevenueMap.set(serviceId, {
                                name: serviceName,
                                amount: serviceGrossRevenue,
                            });
                        }
                    }
                } else if (serviceType === "BULK") {
    const bulkData = await db.bulkService.findMany({
        where: {
            serviceId: serviceId,
            datumNaplate: {
                gte: adjustedStart,
                lte: adjustedEnd,
            },
        },
        select: {
            id: true,
            requests: true,
            message_parts: true,
            datumNaplate: true,
        },
    });

    // Group transactions by month
    const monthlyTransactions = new Map<string, {
        messages: number,
        records: number,
        messageParts: number
    }>();

    let totalRequests = 0;
    let totalRecords = 0;
    let totalMessageParts = 0;

    // ✅ ISPRAVLJENO - dodаta provera za null
    for (const data of bulkData) {
        // Skip records without datumNaplate
        if (!data.datumNaplate) {
            console.warn(`Bulk service record ${data.id} has no datumNaplate, skipping`);
            continue;
        }
        
        const monthKey = data.datumNaplate.toISOString().slice(0, 7); // YYYY-MM format
        
        if (!monthlyTransactions.has(monthKey)) {
            monthlyTransactions.set(monthKey, {
                messages: 0,
                records: 0,
                messageParts: 0
            });
        }
        
        const monthData = monthlyTransactions.get(monthKey)!;
        monthData.messages += data.requests || 0;
        monthData.records += 1; // Each record counts as 1
        monthData.messageParts += data.message_parts || 0;
        
        totalRequests += data.requests || 0;
        totalRecords += 1;
        totalMessageParts += data.message_parts || 0;
    }

    // Calculate revenue per month
    let messageRevenueTotal = 0;
    let recordRevenueTotal = 0;
    
    for (const [month, monthData] of monthlyTransactions) {
        const perMessageRate = monthData.messages >= 1000000 ? 1.20 : 1.50;
        const messageRevenue = monthData.messages * perMessageRate;
        const recordRevenue = monthData.records * 1000; // 1000 RSD per record
        const monthlyRevenue = messageRevenue + recordRevenue;
        
        serviceGrossRevenue += monthlyRevenue;
        messageRevenueTotal += messageRevenue;
        recordRevenueTotal += recordRevenue;
    }

    // Add to service breakdown with details
    if (serviceGrossRevenue > 0) {
        totalGrossRevenue += serviceGrossRevenue;
        
        serviceRevenueMap.set(serviceId, {
            name: serviceName,
            amount: serviceGrossRevenue,
            details: {
                messages: totalRequests,
                messageRevenue: messageRevenueTotal,
                records: totalRecords,
                recordRevenue: recordRevenueTotal,
            }
        });
    }
} else {
                    // For other service types, just add the revenue
                    if (serviceGrossRevenue > 0) {
                        totalGrossRevenue += serviceGrossRevenue;
                        
                        if (serviceRevenueMap.has(serviceId)) {
                            const existing = serviceRevenueMap.get(serviceId)!;
                            existing.amount += serviceGrossRevenue;
                        } else {
                            serviceRevenueMap.set(serviceId, {
                                name: serviceName,
                                amount: serviceGrossRevenue,
                            });
                        }
                    }
                }
            }
        }

        // Format service breakdown with details
        const serviceBreakdown = Array.from(serviceRevenueMap.entries()).map(
            ([id, { name, amount, details }]) => ({
                id,
                name,
                revenueAmount: amount,
                percentage: totalGrossRevenue > 0 ? (amount / totalGrossRevenue) * 100 : 0,
                details
            })
        );

        // Calculate platform and partner revenue
        const platformRevenue = totalGrossRevenue * (contract.revenuePercentage / 100);
        const partnerRevenue = totalGrossRevenue - platformRevenue;

        return {
            totalGrossRevenue,
            platformRevenue,
            partnerRevenue,
            serviceBreakdown,
        };

    } catch (error) {
        console.error(`Error calculating revenue:`, error);
        return {
            totalGrossRevenue: 0,
            platformRevenue: 0,
            partnerRevenue: 0,
            serviceBreakdown: [],
        };
    }
};