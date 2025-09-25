//actions/contracts/linkServiceToContract.ts

"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { ActivityLogService } from "@/lib/services/activity-log-service";
import { LogSeverity } from "@prisma/client";

const linkServiceToContractSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required."),
  contractId: z.string().min(1, "Contract ID is required."),
});

interface LinkServiceToContractResult {
  success: boolean;
  data?: { serviceContractId: string };
  error?: string;
}

export async function linkServiceToContract(
  params: z.infer<typeof linkServiceToContractSchema>
): Promise<LinkServiceToContractResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedParams = linkServiceToContractSchema.safeParse(params);

    if (!validatedParams.success) {
      console.error("Link service to contract validation failed:", validatedParams.error.errors);
      return { success: false, error: "Invalid input data." };
    }

    const { serviceId, contractId } = validatedParams.data;

    // Proveri da li ServiceContract već postoji
    const existingServiceContract = await db.serviceContract.findUnique({
      where: {
        contractId_serviceId: {
          contractId: contractId,
          serviceId: serviceId,
        },
      },
    });

    if (existingServiceContract) {
      return { success: false, error: "Service is already linked to this contract." };
    }

    // Kreiraj novi ServiceContract zapis
    const newServiceContract = await db.serviceContract.create({
      data: {
        contractId: contractId,
        serviceId: serviceId,
        // specificTerms: "Default terms for linked service", // Opciono: dodajte podrazumevane uslove
      },
    });

    // Log activity
    await ActivityLogService.log({
      action: "LINK_SERVICE_TO_CONTRACT",
      entityType: "SERVICE_CONTRACT",
      entityId: newServiceContract.id,
      details: `Service ID ${serviceId} linked to Contract ID ${contractId}.`,
      severity: LogSeverity.INFO,
      userId: currentUser.id,
    });

    // Revalidiraj relevantne putanje
    revalidatePath(`/contracts/${contractId}`);
    revalidatePath(`/providers`); // Možda i stranicu provajdera ako prikazuje povezane servise/ugovore
    revalidatePath(`/services/${serviceId}`); // Možda i stranicu servisa

    return { success: true, data: { serviceContractId: newServiceContract.id } };

  } catch (error) {
    console.error("[LINK_SERVICE_TO_CONTRACT_ERROR]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to link service to contract.",
    };
  }
}
