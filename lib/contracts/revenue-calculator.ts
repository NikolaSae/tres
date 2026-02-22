// lib/contracts/revenue-calculator.ts

import { db } from '@/lib/db';
import { Contract, ServiceContract, ServiceType } from '@prisma/client';
import { max, min } from 'date-fns';

type ContractWithServicesAndProvider = Contract & {
    services: (ServiceContract & { service: { id: string, type: ServiceType, name: string } })[];
    provider: { id: string } | null;
    parkingService: { id: string } | null;
    humanitarianOrg: { id: string } | null;
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

        const periodStart = calculationStartDate
            ? max([contract.startDate, calculationStartDate])
            : contract.startDate;

        const periodEnd = calculationEndDate
            ? min([contract.endDate, calculationEndDate])
            : contract.endDate;

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

        // ── PARKING ──────────────────────────────────────────────────────────
        if (contract.type === "PARKING" && contract.parkingService?.id) {
            const serviceIds = contract.services.map(sc => sc.serviceId);

            const parkingTransactions = await db.parkingTransaction.findMany({
                where: {
                    serviceId: { in: serviceIds },
                    parkingServiceId: contract.parkingService.id,
                    date: { gte: adjustedStart, lte: adjustedEnd },
                },
                select: {
                    amount: true,
                    serviceId: true,
                    service: { select: { name: true } }
                },
            });

            for (const transaction of parkingTransactions) {
                const serviceId = transaction.serviceId;
                const serviceName = transaction.service?.name || "Unknown Service";

                if (!serviceRevenueMap.has(serviceId)) {
                    serviceRevenueMap.set(serviceId, { name: serviceName, amount: 0 });
                }

                const current = serviceRevenueMap.get(serviceId)!;
                current.amount += transaction.amount || 0;
                totalGrossRevenue += transaction.amount || 0;
            }

        // ── HUMANITARIAN ─────────────────────────────────────────────────────
        } else if (contract.type === "HUMANITARIAN" && contract.humanitarianOrg?.id) {
            const humanitarianTransactions = await db.humanitarianTransaction.findMany({
                where: {
                    humanitarianOrgId: contract.humanitarianOrg.id,
                    date: { gte: adjustedStart, lte: adjustedEnd },
                },
                select: {
                    amount: true,
                    serviceId: true,
                    serviceName: true,
                    billingType: true,
                }
            });

            for (const transaction of humanitarianTransactions) {
                const serviceId = transaction.serviceId;
                const serviceName = transaction.serviceName || "Unknown Service";

                if (!serviceRevenueMap.has(serviceId)) {
                    serviceRevenueMap.set(serviceId, { name: serviceName, amount: 0 });
                }

                const current = serviceRevenueMap.get(serviceId)!;
                current.amount += transaction.amount || 0;
                totalGrossRevenue += transaction.amount || 0;
            }

        // ── VAS / BULK / ostalo ──────────────────────────────────────────────
        } else {
            for (const serviceLink of contract.services) {
                const serviceId = serviceLink.serviceId;
                const serviceType = serviceLink.service.type;
                const serviceName = serviceLink.service.name;

                let serviceGrossRevenue = 0;

                if (serviceType === "VAS" && contract.providerId) {
                    const vasData = await db.vasTransaction.findMany({
                        where: {
                            serviceId,
                            providerId: contract.providerId,
                            date: { gte: adjustedStart, lte: adjustedEnd },
                        },
                    });

                    serviceGrossRevenue = vasData.reduce(
                        (sum, data) => sum + (data.amount || 0), 0
                    );

                    if (serviceGrossRevenue > 0) {
                        totalGrossRevenue += serviceGrossRevenue;

                        if (serviceRevenueMap.has(serviceId)) {
                            serviceRevenueMap.get(serviceId)!.amount += serviceGrossRevenue;
                        } else {
                            serviceRevenueMap.set(serviceId, { name: serviceName, amount: serviceGrossRevenue });
                        }
                    }

                } else if (serviceType === "BULK") {
                    const bulkData = await db.bulkService.findMany({
                        where: {
                            serviceId,
                            datumNaplate: { gte: adjustedStart, lte: adjustedEnd },
                        },
                        select: {
                            id: true,
                            requests: true,
                            message_parts: true,
                            datumNaplate: true,
                        },
                    });

                    const monthlyTransactions = new Map<string, {
                        messages: number;
                        records: number;
                        messageParts: number;
                    }>();

                    let totalRequests = 0;
                    let totalRecords = 0;
                    let totalMessageParts = 0;

                    for (const data of bulkData) {
                        if (!data.datumNaplate) {
                            console.warn(`Bulk service record ${data.id} has no datumNaplate, skipping`);
                            continue;
                        }

                        const monthKey = data.datumNaplate.toISOString().slice(0, 7);

                        if (!monthlyTransactions.has(monthKey)) {
                            monthlyTransactions.set(monthKey, { messages: 0, records: 0, messageParts: 0 });
                        }

                        const monthData = monthlyTransactions.get(monthKey)!;
                        monthData.messages += data.requests || 0;
                        monthData.records += 1;
                        monthData.messageParts += data.message_parts || 0;

                        totalRequests += data.requests || 0;
                        totalRecords += 1;
                        totalMessageParts += data.message_parts || 0;
                    }

                    let messageRevenueTotal = 0;
                    let recordRevenueTotal = 0;

                    for (const [, monthData] of monthlyTransactions) {
                        const perMessageRate = monthData.messages >= 1000000 ? 1.20 : 1.50;
                        const messageRevenue = monthData.messages * perMessageRate;
                        const recordRevenue = monthData.records * 1000;

                        serviceGrossRevenue += messageRevenue + recordRevenue;
                        messageRevenueTotal += messageRevenue;
                        recordRevenueTotal += recordRevenue;
                    }

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
                    if (serviceGrossRevenue > 0) {
                        totalGrossRevenue += serviceGrossRevenue;

                        if (serviceRevenueMap.has(serviceId)) {
                            serviceRevenueMap.get(serviceId)!.amount += serviceGrossRevenue;
                        } else {
                            serviceRevenueMap.set(serviceId, { name: serviceName, amount: serviceGrossRevenue });
                        }
                    }
                }
            }
        }

        const serviceBreakdown = Array.from(serviceRevenueMap.entries()).map(
            ([id, { name, amount, details }]) => ({
                id,
                name,
                revenueAmount: amount,
                percentage: totalGrossRevenue > 0 ? (amount / totalGrossRevenue) * 100 : 0,
                details
            })
        );

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