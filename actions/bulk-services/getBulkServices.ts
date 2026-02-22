// actions/bulk-services/getBulkServices.ts
"use server";
import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { BulkServiceFilters } from "@/lib/types/bulk-service-types";
import { getCurrentUser } from "@/lib/session";
import { Prisma } from "@prisma/client";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

type GetBulkServicesParams = BulkServiceFilters & PaginationParams;

async function fetchBulkServices(
  providerId: string | undefined,
  serviceId: string | undefined,
  providerName: string | undefined,
  serviceName: string | undefined,
  senderName: string | undefined,
  startDate: Date | undefined,
  endDate: Date | undefined,
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: "asc" | "desc"
) {
  "use cache";
  cacheTag("bulk-services");

  const skip = (page - 1) * limit;
  const where: Prisma.BulkServiceWhereInput = {};

  if (providerId) where.providerId = providerId;
  if (serviceId) where.serviceId = serviceId;
  if (providerName) where.provider_name = { contains: providerName, mode: "insensitive" };
  if (serviceName) where.service_name = { contains: serviceName, mode: "insensitive" };
  if (senderName) where.sender_name = { contains: senderName, mode: "insensitive" };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [totalCount, bulkServices] = await Promise.all([
    db.bulkService.count({ where }),
    db.bulkService.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        provider: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    data: bulkServices,
    meta: {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

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
    if (!currentUser) throw new ServerError("Unauthorized");

    return await fetchBulkServices(
      providerId, serviceId, providerName, serviceName, senderName,
      startDate, endDate, page, limit, sortBy, sortOrder
    );
  } catch (error) {
    console.error("[GET_BULK_SERVICES]", error);
    if (error instanceof ServerError) throw error;
    throw new ServerError("Neuspešno dohvatanje bulk servisa");
  }
}