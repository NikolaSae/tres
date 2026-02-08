// actions/products/get.ts
"use server";

import { db } from "@/lib/db";

export async function getProductById(id: string) {
  try {
    const product = await db.product.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            provider: true,
          },
        },
      },
    });

    if (!product) {
      return { error: "Product not found" };
    }

    return { product };
  } catch (error) {
    console.error("[GET_PRODUCT_BY_ID]", error);
    return { error: "Failed to fetch product" };
  }
}