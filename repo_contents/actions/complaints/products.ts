"use server";

///actions/complaints/products.ts



import { db } from "@/lib/db";

interface ProductData {
  id: string;
  name: string;
}

export async function getProductsByServiceId(serviceId: string | null): Promise<ProductData[]> {
  if (!serviceId) {
    console.log("No serviceId provided to getProductsByServiceId");
    return [];
  }

  try {
    const products = await db.product.findMany({
        where: {
            serviceId: serviceId
        },
        select: {
            id: true,
            name: true,
        },
        orderBy: { name: 'asc' },
    });

    console.log(`Workspaceed ${products.length} products for service ${serviceId}`);
    return products;

  } catch (error) {
    console.error(`Error fetching products for service ${serviceId}:`, error);
    return [];
  }
}