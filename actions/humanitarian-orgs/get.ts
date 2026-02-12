// actions/humanitarian-orgs/get.ts

'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function getHumanitarianOrgs(includeRenewals: boolean = false) {
  try {
    const session = await auth();
    
    if (!session) {
      throw new Error('Unauthorized');
    }

    const orgs = await prisma.humanitarianOrg.findMany({
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
        address: true,
        website: true,
        mission: true,
        pib: true,
        registrationNumber: true,
        bank: true,
        accountNumber: true,
        shortNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        ...(includeRenewals && {
          renewals: {
            select: {
              id: true,
              renewalStartDate: true,
              proposedStartDate: true,
              proposedEndDate: true,
              subStatus: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: {
              renewalStartDate: 'desc'
            }
          }
        }),
        _count: {
          select: {
            complaints: true,
            renewals: true,
            contracts: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return orgs;
  } catch (error) {
    console.error('Error fetching humanitarian organizations:', error);
    throw error;
  }
}