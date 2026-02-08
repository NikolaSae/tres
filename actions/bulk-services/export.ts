// actions/bulk-services/export.ts

"use server";

import { db } from "@/lib/db";
import { ServerError } from "@/lib/exceptions";
import { getCurrentUser } from "@/lib/session";
import { formatBulkServiceCSV } from "@/lib/bulk-services/csv-processor";
import { BulkServiceFilters } from "@/lib/types/bulk-service-types";  // ← ispravljeno: BulkServiceFilters

export async function exportBulkServices(filters?: BulkServiceFilters) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      throw new ServerError("Unauthorized – korisnik nije prijavljen");
    }

    // Građenje Prisma where uslova na osnovu filtera
    const where: any = {};

    if (filters?.providerId) {
      where.providerId = filters.providerId;
    }
    if (filters?.serviceId) {
      where.serviceId = filters.serviceId;
    }
    if (filters?.providerName) {
      where.provider_name = {
        contains: filters.providerName,
        mode: "insensitive",
      };
    }
    if (filters?.serviceName) {
      where.service_name = {
        contains: filters.serviceName,
        mode: "insensitive",
      };
    }
    if (filters?.senderName) {
      where.sender_name = {
        contains: filters.senderName,
        mode: "insensitive",
      };
    }
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    // Dohvatanje podataka iz baze
    const bulkServices = await db.bulkService.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        provider_name: true,
        agreement_name: true,
        service_name: true,
        step_name: true,
        sender_name: true,
        requests: true,
        message_parts: true,
        createdAt: true,
        datumNaplate: true,
        // Dodaj još polja ako želiš da se pojave u CSV-u
      },
    });

    if (bulkServices.length === 0) {
      return {
        success: false,
        message: "Nema bulk servisa koji odgovaraju filterima",
      };
    }

    // Generisanje CSV sadržaja
    const csvContent = formatBulkServiceCSV(bulkServices);

    return {
      success: true,
      csvContent,
      filename: `bulk-services-export-${new Date().toISOString().split("T")[0]}.csv`,
      recordCount: bulkServices.length,
    };
  } catch (error) {
    console.error("[EXPORT_BULK_SERVICES]", error);

    if (error instanceof Error) {
      throw new ServerError(`Greška pri eksportu: ${error.message}`);
    }

    throw new ServerError("Neočekivana greška prilikom eksporta bulk servisa");
  }
}