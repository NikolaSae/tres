///actions/contracts/delete-attachment.ts

'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export const deleteAttachment = async (contractId: string, attachmentId: string) => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "Unauthorized" };
  }

  try {
    // Verify user has permission to delete
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      select: { createdById: true }
    });

    if (!contract) {
      return { error: "Contract not found" };
    }

    // Only contract owner or admin can delete
    if (contract.createdById !== userId && session.user.role !== 'ADMIN') {
      return { error: "Unauthorized" };
    }

    // Delete the attachment
    await db.contractAttachment.delete({
      where: { id: attachmentId }
    });

    // Revalidate cache
    revalidatePath(`/contracts/${contractId}`);
    revalidatePath(`/contracts/${contractId}/edit`);

    return { success: "Attachment deleted successfully!" };

  } catch (error) {
    console.error("Error deleting attachment:", error);
    return { error: "Failed to delete attachment" };
  }
};