// /actions/contracts/add-attachment.ts
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { validateContractAttachment } from '@/lib/contracts/validators';
import { uploadFile } from '@/lib/file-storage'; // Now exists

export const addAttachment = async (formData: FormData) => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "Unauthorized" };
  }

  // Get form data
  const contractId = formData.get('contractId') as string;
  const file = formData.get('file') as File | null;

  if (!file) {
    return { error: "No file provided." };
  }

  // Validate file
  const validationResult = validateContractAttachment(file);
  if (!validationResult.success) {
    return { error: validationResult.errors?.join(', ') || "Invalid file." };
  }

  try {
    // Check if contract exists
    const existingContract = await db.contract.findUnique({
      where: { id: contractId },
    });

    if (!existingContract) {
      return { error: "Contract not found." };
    }

    // Upload file to storage
    const uploadResult = await uploadFile(file, `contracts/${contractId}/attachments/`);

    if (!uploadResult.success || !uploadResult.fileUrl) {
      return { error: uploadResult.error || "Failed to upload file." };
    }

    // Create attachment record
    const newAttachment = await db.contractAttachment.create({
      data: {
        contractId: contractId,
        name: file.name,
        fileUrl: uploadResult.fileUrl,
        fileType: file.type,
        uploadedById: userId,
      },
    });

    // Revalidate cache
    revalidatePath(`/contracts/${contractId}`);
    revalidatePath(`/contracts/${contractId}/edit`);

    return { 
      success: "Attachment added successfully!", 
      attachment: newAttachment 
    };

  } catch (error) {
    console.error(`Error adding attachment:`, error);
    return { error: "Failed to add attachment." };
  }
};