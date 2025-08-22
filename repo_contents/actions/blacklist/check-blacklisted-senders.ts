// actions/blacklist/check-blacklisted-senders.ts
"use server";

import { db } from "@/lib/db";

export async function checkBlacklistedSenders() {
  try {
    const blacklistEntries = await db.senderBlacklist.findMany({
      where: {
        isActive: true,
        effectiveDate: {
          lte: new Date()
        }
      }
    });

    const matches = [];
    
    for (const entry of blacklistEntries) {
      const matchingBulkServices = await db.bulkService.findMany({
        where: {
          sender_name: entry.senderName
        },
        include: {
          provider: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (matchingBulkServices.length > 0) {
        // Extract provider names
        const providerNames = matchingBulkServices.map(
          service => service.provider.name
        );
        
        await db.senderBlacklist.update({
          where: { id: entry.id },
          data: {
            matchCount: {
              increment: matchingBulkServices.length
            },
            lastMatchDate: new Date()
          }
        });

        matches.push({
          blacklistEntry: entry,
          matchingServices: matchingBulkServices,
          providerNames // Add provider names to the match
        });
      }
    }

    return { success: true, matches };
  } catch (error) {
    console.error("Error checking blacklisted senders:", error);
    return { success: false, error: "Failed to check blacklisted senders" };
  }
}