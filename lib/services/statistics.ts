// lib/services/statistics.ts - POTPUNO ISPRAVLJENO
import { db } from '@/lib/db';
import { ContractStatus } from '@prisma/client';

interface RevenueSummary {
  id: string;
  name: string;
  totalRevenue: number;
  contractsCount: number;
}

interface ComplaintCostSummary {
  id: string;
  name: string;
  averageCost: number;
  totalComplaints: number;
}

/**
 * Izračunava sumu prihoda za date servise na osnovu povezanih ugovora.
 */
export async function getServiceRevenueSummary(serviceIds: string[]): Promise<RevenueSummary[]> {
  try {
    // ✅ ISPRAVLJENO: Koristimo ServiceContract join tabelu
    const serviceContracts = await db.serviceContract.findMany({
      where: {
        serviceId: { in: serviceIds },
        service: {
          isActive: true,
        },
        contract: {
          status: {
            in: [ContractStatus.ACTIVE] // ✅ COMPLETED ne postoji u enum-u
          }
        }
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
          }
        },
        contract: {
          select: {
            id: true,
            status: true,
            revenuePercentage: true,
          }
        }
      }
    });

    // Grupisanje po servisu
    const serviceMap = new Map<string, { name: string; totalRevenue: number; contractsCount: number }>();

    serviceContracts.forEach(sc => {
      const serviceId = sc.service.id;
      const serviceName = sc.service.name;
      const revenue = sc.contract.revenuePercentage || 0;

      if (!serviceMap.has(serviceId)) {
        serviceMap.set(serviceId, {
          name: serviceName,
          totalRevenue: 0,
          contractsCount: 0
        });
      }

      const serviceData = serviceMap.get(serviceId)!;
      serviceData.totalRevenue += revenue;
      serviceData.contractsCount += 1;
    });

    // Konverzija u array
    const revenueSummary: RevenueSummary[] = Array.from(serviceMap.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      totalRevenue: data.totalRevenue,
      contractsCount: data.contractsCount,
    }));

    return revenueSummary;
  } catch (error) {
    console.error("Error calculating service revenue summary:", error);
    throw new Error("Failed to calculate service revenue summary.");
  }
}

/**
 * Izračunava statistike o reklamacijama za date proizvode.
 */
export async function getProductComplaintStats(productIds: string[]): Promise<ComplaintCostSummary[]> {
  try {
    const productsWithComplaints = await db.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      include: {
        _count: {
          select: { 
            complaints: true 
          }
        },
        complaints: {
          select: {
            id: true,
            status: true,
            financialImpact: true,
          },
        }
      }
    });

    const complaintStats: ComplaintCostSummary[] = productsWithComplaints.map(product => {
      let totalCost = 0;
      let validComplaintsCount = 0;

      product.complaints.forEach(complaint => {
        if (complaint.financialImpact !== null && complaint.financialImpact !== undefined) {
          totalCost += complaint.financialImpact;
          validComplaintsCount++;
        }
      });

      const averageCost = validComplaintsCount > 0 ? totalCost / validComplaintsCount : 0;

      return {
        id: product.id,
        name: product.name,
        averageCost: averageCost,
        totalComplaints: product._count?.complaints ?? 0,
      };
    });

    return complaintStats;
  } catch (error) {
    console.error("Error calculating product complaint stats:", error);
    throw new Error("Failed to calculate product complaint stats.");
  }
}