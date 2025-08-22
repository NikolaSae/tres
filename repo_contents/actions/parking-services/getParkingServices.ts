//actions/parking-services/getParkingServices.ts

"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ParkingServiceFilters, PaginatedParkingServices } from "@/lib/types/parking-service-types";
import { parkingServiceFiltersSchema } from "@/schemas/parking-service";

export async function getParkingServices(
  filters: ParkingServiceFilters = {}
): Promise<{ success: boolean; data?: PaginatedParkingServices; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      // For data retrieval actions, you might return an empty list or specific error
      // depending on your security policy for unauthorized users.
      // Returning an error might be safer if the data is sensitive.
      return { success: false, error: "Unauthorized" };
    }

    const validatedFilters = parkingServiceFiltersSchema.parse(filters);
    const {
      searchTerm,
      isActive,
      sortBy = "name",
      sortDirection = "asc",
      page = 1,
      pageSize = 10,
    } = validatedFilters;

    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { contactName: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { address: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const totalCount = await db.parkingService.count({ where });

    const parkingServices = await db.parkingService.findMany({
      where,
      orderBy: {
        [sortBy]: sortDirection,
      },
      skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    // Uklonjen logActivity poziv - ne treba log za GET operacije

    return {
      success: true,
      data: {
        parkingServices,
        totalCount,
        page,
        pageSize,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching parking services:", error);
     // Handle Zod validation errors specifically if needed
     // if (error instanceof z.ZodError) { ... }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch parking services",
    };
  }
}