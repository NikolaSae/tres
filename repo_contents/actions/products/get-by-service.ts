// /actions/products/get-by-service.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getProductsByService(serviceId?: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized access");
  }

  // If no service ID is provided, return all active products
  if (!serviceId) {
    return db.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
      },
    });
  }

  // First, fetch complaints that are associated with the given service
  const complaintsWithService = await db.complaint.findMany({
    where: {
      serviceId,
      productId: { not: null },
    },
    select: {
      productId: true,
    },
    distinct: ["productId"],
  });

  // Extract product IDs
  const productIds = complaintsWithService.map(c => c.productId).filter(Boolean) as string[];

  // If we have associated products, fetch them
  if (productIds.length > 0) {
    return db.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
      },
    });
  }

  // If no products are associated with this service, return all active products
  return db.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
    },
  });
}