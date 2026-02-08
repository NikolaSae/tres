//actions/products/update.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateProduct(id: string, data: any) {
  try {
    const product = await db.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        // Add other fields as needed
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