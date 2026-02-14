// actions/bulk-services/getBulkServices.ts
"use server";

import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { BulkServiceFilters } from "@/lib/types/bulk-service-types";
import { getCurrentUser } from "@/lib/session";
import { Prisma } from "@prisma/client";

// Dodajemo poseban tip za paginaciju i sortiranje
interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Kombinujemo filtere i paginaciju u jedan objekat
type GetBulkServicesParams = BulkServiceFilters & PaginationParams;

export async function getBulkServices({
  providerId,
  serviceId,
  providerName,
  serviceName,
  senderName,
  startDate,
  endDate,
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
}: GetBulkServicesParams = {}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Unauthorized");
    }

    const skip = (page - 1) * limit;

    // Građenje Prisma where uslova
    const where: Prisma.BulkServiceWhereInput = {};

    // Filter by provider ID (relacija)
    if (providerId) {
      where.providerId = providerId;
    }

    // Filter by service ID (relacija)
    if (serviceId) {
      where.serviceId = serviceId;
    }

    // Filter by provider name (direktna kolona u tabeli)
    if (providerName) {
      where.provider_name = {
        contains: providerName,
        mode: "insensitive",
      };
    }

    // Filter by service name (direktna kolona u tabeli)
    if (serviceName) {
      where.service_name = {
        contains: serviceName,
        mode: "insensitive",
      };
    }

    // Filter by sender name (direktna kolona u tabeli)
    if (senderName) {
      where.sender_name = {
        contains: senderName,
        mode: "insensitive",
      };
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Ukupan broj zapisa (za paginaciju)
    const totalCount = await db.bulkService.count({ where });

    // Dohvatanje podataka sa SAMO relacionim tabelama koje POSTOJE
    const bulkServices = await db.bulkService.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transformišemo podatke - svi _name field-ovi već postoje u bazi!
    const data = bulkServices.map((bs) => ({
      ...bs,
      // Ovi field-ovi već postoje u bazi, samo ih prosleđujemo
      // Ne treba mapiranje jer su već u objektu
    }));

    return {
      data,
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error("[GET_BULK_SERVICES]", error);
    throw new ServerError("Neuspešno dohvatanje bulk servisa");
  }
}