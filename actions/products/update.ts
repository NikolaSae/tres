//actions/products/update.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface UpdateProductData {
  name?: string;
  code?: string;
  description?: string | null;
  isActive?: boolean;
  serviceId?: string | null;
}

export async function updateProduct(id: string, data: UpdateProductData) {
  try {
    const product = await db.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.serviceId !== undefined && { serviceId: data.serviceId }),
      },
    });

    revalidatePath("/products");
    revalidatePath(`/products/${id}`);

    return { success: true, product };
  } catch (error) {
    console.error("[UPDATE_PRODUCT]", error);
    return { success: false, error: "Failed to update product" };
  }
}