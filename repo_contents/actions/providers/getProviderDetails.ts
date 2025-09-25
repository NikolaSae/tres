///actions/providers/getProviderDetails.ts

"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/security/audit-logger";
import { ProviderWithDetails } from '@/lib/types/provider-types'; // Assuming this type exists

export async function getProviderDetails(
  providerId: string
): Promise<{ success: boolean; data?: ProviderWithDetails; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const provider = await db.provider.findUnique({
      where: { id: providerId },
      include: {
        contracts: {
          select: {
            id: true,
            name: true,
            contractNumber: true,
            status: true,
            endDate: true,
            revenuePercentage: true,
            isRevenueSharing: true,
            operatorRevenue: true,
            operator: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        vasServices: { select: { id: true, proizvod: true, mesec_pruzanja_usluge: true, naplacen_iznos: true } },
        bulkServices: { select: { id: true, service_name: true, requests: true } },
        complaints: { select: { id: true, title: true, status: true, createdAt: true } },
        _count: {
            select: { contracts: true, vasServices: true, bulkServices: true, complaints: true }
        }
      },
    });

    if (!provider) {
      return { success: false, error: "Provider not found" };
    }

    await logActivity("GET_PROVIDER_DETAILS", {
      entityType: "provider",
      entityId: providerId,
      userId: currentUser.id,
      details: `Retrieved provider details for ID: ${providerId}`,
    });

    return { success: true, data: provider as ProviderWithDetails };

  } catch (error) {
    console.error(`Error fetching provider ${providerId} details:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch provider details",
    };
  }
}
