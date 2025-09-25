// /actions/providers/get-by-service.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getProvidersByService(serviceId?: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized access");
  }

  if (!serviceId) {
    // Return all active providers if no service ID is provided
    return db.provider.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
      },
    });
  }

  // Check if the service exists
  const service = await db.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw new Error("Service not found");
  }

  // Get providers associated with this service through contracts
  const contractsWithService = await db.serviceContract.findMany({
    where: {
      serviceId,
    },
    select: {
      contract: {
        select: {
          providerId: true,
        },
      },
    },
  });

  // Extract provider IDs
  const providerIds = contractsWithService
    .map(sc => sc.contract.providerId)
    .filter(Boolean) as string[];

  // If there are associated providers, fetch them
  if (providerIds.length > 0) {
    return db.provider.findMany({
      where: {
        id: { in: providerIds },
        isActive: true,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
      },
    });
  }

  // If no providers are directly associated, return all active providers
  return db.provider.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      contactName: true,
      email: true,
      phone: true,
    },
  });
}