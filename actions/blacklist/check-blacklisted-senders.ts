// actions/blacklist/check-blacklisted-senders.ts
"use server";
import { db } from "@/lib/db";

export async function checkBlacklistedSenders() {
  try {
    const blacklistEntries = await db.senderBlacklist.findMany({
      where: {
        isActive: true,
        effectiveDate: { lte: new Date() }
      }
    });

    if (blacklistEntries.length === 0) {
      return { success: true, matches: [] };
    }

    // Jedan query umesto N querija u loopu
    const senderNames = blacklistEntries.map(e => e.senderName);
    const matchingServices = await db.bulkService.findMany({
      where: { sender_name: { in: senderNames } },
      include: {
        provider: {
          select: { id: true, name: true }
        }
      }
    });

    // Grupiši po sender_name
    const servicesBySender = matchingServices.reduce<Record<string, typeof matchingServices>>(
      (acc, service) => {
        const key = service.sender_name;
        if (!acc[key]) acc[key] = [];
        acc[key].push(service);
        return acc;
      },
      {}
    );

    const matches = [];
    const updatePromises = [];

    for (const entry of blacklistEntries) {
      const services = servicesBySender[entry.senderName];
      if (!services || services.length === 0) continue;

      updatePromises.push(
        db.senderBlacklist.update({
          where: { id: entry.id },
          data: {
            matchCount: { increment: services.length },
            lastMatchDate: new Date()
          }
        })
      );

      matches.push({
        blacklistEntry: entry,
        matchingServices: services,
        providerNames: services.map(s => s.provider.name)
      });
    }

    // Paralelni update umesto sekvencijalnog
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    return { success: true, matches };
  } catch (error) {
    console.error("Error checking blacklisted senders:", error);
    return { success: false, error: "Failed to check blacklisted senders" };
  }
}