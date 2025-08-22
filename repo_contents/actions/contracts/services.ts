// /actions/contracts/services.ts
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { SelectedService } from '@/lib/types/contract-types';


interface AddContractServiceInput {
    contractId: string;
    serviceId: string;
    specificTerms?: string | null;
}

export async function addContractService(input: AddContractServiceInput): Promise<{ success?: string; newLink?: SelectedService; error?: string }> {
    if (!input.contractId || !input.serviceId) {
        return { error: 'Contract ID and Service ID are required.' };
    }

    try {
         const existingLink = await db.contractsOnServices.findUnique({
             where: {
                 contractId_serviceId: {
                     contractId: input.contractId,
                     serviceId: input.serviceId,
                 },
             },
             include: {
                  service: true,
             }
         });

         if (existingLink) {
             return { error: 'This service is already linked to this contract.' };
         }


        const createdLink = await db.contractsOnServices.create({
            data: {
                contractId: input.contractId,
                serviceId: input.serviceId,
                specificTerms: input.specificTerms || null,
            },
             include: {
                  service: true,
             }
        });

         const newSelectedService: SelectedService = {
             id: createdLink.id,
             serviceId: createdLink.serviceId,
             service: createdLink.service as any,
             specificTerms: createdLink.specificTerms,
         };


        revalidatePath(`/contracts/${input.contractId}`);


        return { success: 'Service linked successfully.', newLink: newSelectedService };

    } catch (error) {
        console.error("Error linking service to contract:", error);
        return { error: 'Failed to link service to contract.' };
    }
}


export async function removeContractService(linkId: string): Promise<{ success?: string; error?: string }> {
    if (!linkId) {
        return { error: 'Link ID is required to remove service.' };
    }

    try {
        const linkToRemove = await db.contractsOnServices.findUnique({
            where: { id: linkId },
        });

        if (!linkToRemove) {
            return { error: 'Service link not found.' };
        }

        await db.contractsOnServices.delete({
            where: { id: linkId },
        });

        revalidatePath(`/contracts/${linkToRemove.contractId}`);


        return { success: 'Service unlinked successfully.' };

    } catch (error) {
        console.error(`Error unlinking service link ${linkId}:`, error);
        return { error: 'Failed to unlink service.' };
    }
}