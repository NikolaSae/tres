///actions/contracts/getProviderContractsForLinking.ts

"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

interface ContractForLinking {
  id: string;
  name: string;
  contractNumber: string;
}

interface GetProviderContractsForLinkingResult {
  success: boolean;
  data?: ContractForLinking[];
  error?: string;
}

export async function getProviderContractsForLinking(
  providerId: string
): Promise<GetProviderContractsForLinkingResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    if (!providerId) {
      return { success: false, error: "Provider ID is required." };
    }

    const contracts = await db.contract.findMany({
      where: {
        providerId: providerId,
        // Opciono: filtrirajte samo aktivne ugovore ili ugovore određenog tipa
        // status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        contractNumber: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return { success: true, data: contracts };

  } catch (error) {
    console.error("[GET_PROVIDER_CONTRACTS_FOR_LINKING_ERROR]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch contracts for linking.",
    };
  }
}
