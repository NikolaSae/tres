// /actions/humanitarian-orgs/get.ts
'use server';

import { db } from '@/lib/db';
import { HumanitarianOrgWithDetails, HumanitarianOrgFilterOptions } from '@/lib/types/humanitarian-org-types';
import { auth } from '@/auth';
import { UserRole } from "@prisma/client";
import { currentRole } from '@/lib/auth';

interface GetOrgsParams extends HumanitarianOrgFilterOptions {
    page?: number;
    limit?: number;
}

export async function getHumanitarianOrgs(params: GetOrgsParams) {
    const session = await auth();
    if (!session?.user) {
        return { data: [], total: 0, error: "Unauthorized" };
     }

    const role = await currentRole();
    if (role !== UserRole.ADMIN && role !== UserRole.MANAGER && role !== UserRole.USER) {
        return { data: [], total: 0, error: "Forbidden" };
     }

    try {
        const { search, isActive, page = 1, limit = 10 } = params;

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' as const } },
                { contactName: { contains: search, mode: 'insensitive' as const } },
            ];
        }
        if (isActive !== null && isActive !== undefined) {
            where.isActive = isActive;
        }

        const skip = (page - 1) * limit;

        const [organizations, totalCount] = await Promise.all([
            db.humanitarianOrg.findMany({
                where,
                take: limit,
                skip: skip,
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    contactName: true,
                    email: true,
                    phone: true,
                    address: true,
                    website: true,
                    mission: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    pib: true,
                    registrationNumber: true,
                    bank: true,
                    accountNumber: true,
                    shortNumber: true,
                    _count: {
                        select: {
                            contracts: true,
                            renewals: true,
                            complaints: true
                        }
                    }
                }
            }),
            db.humanitarianOrg.count({ where }),
        ]);

        // Map contactName to contactPerson to match HumanitarianOrgWithDetails type
        const mappedOrganizations = organizations.map(({ contactName, ...org }) => ({
            ...org,
            contactPerson: contactName,
        })) as HumanitarianOrgWithDetails[];

        return { data: mappedOrganizations, total: totalCount, error: null };

    } catch (error) {
        console.error("Error fetching humanitarian organizations in action:", error);
        return { data: [], total: 0, error: "Failed to fetch humanitarian organizations." };
    }
}