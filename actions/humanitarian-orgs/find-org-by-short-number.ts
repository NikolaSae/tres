// actions/humanitarian-orgs/find-org-by-short-number.ts
"use server";

import { db } from "@/lib/db";

export async function findHumanitarianOrgByShortNumber(shortNumber: string) {
  try {
    if (!shortNumber || shortNumber.length !== 4) {
      return { error: "Invalid short number format" };
    }

    // Find org by short number with active contract
    const org = await db.humanitarianOrg.findFirst({
      where: {
        shortNumber: shortNumber,
        isActive: true,
      },
      include: {
        contracts: {
          where: {
            status: {
              in: ['ACTIVE', 'RENEWAL_IN_PROGRESS']
            },
            type: 'HUMANITARIAN'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            services: {
              include: {
                service: true
              }
            }
          }
        }
      }
    });

    if (!org) {
      return { error: `Humanitarian organization with short number ${shortNumber} not found` };
    }

    if (org.contracts.length === 0) {
      return { 
        error: `Organization "${org.name}" found, but has no active contracts`,
        organizationId: org.id,
        organizationName: org.name,
      };
    }

    return {
      success: true,
      organization: {
        id: org.id,
        name: org.name,
        shortNumber: org.shortNumber,
        hasActiveContract: true,
        activeContract: org.contracts[0],
        serviceCount: org.contracts[0].services.length,
      }
    };

  } catch (error: any) {
    console.error("Error finding org by short number:", error);
    return { error: error.message || "Failed to find organization" };
  }
}

export async function getAllHumanitarianOrgs() {
  try {
    const orgs = await db.humanitarianOrg.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        shortNumber: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return { success: true, organizations: orgs };
  } catch (error: any) {
    console.error("Error fetching humanitarian orgs:", error);
    return { error: error.message || "Failed to fetch organizations" };
  }
}