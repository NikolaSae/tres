import { cacheTag, cacheLife } from 'next/cache';
import { db } from '@/lib/db';
import { CACHE_TAGS } from '@/lib/cache/config';

/**
 * Fetch svih humanitarian organizacija
 */
export async function getHumanitarianOrgs() {
  'use cache';
  cacheLife('rare');
  cacheTag(CACHE_TAGS.HUMANITARIAN_ORGS, CACHE_TAGS.HUMANITARIAN_ORGS_LIST);

  try {
    const orgs = await db.humanitarianOrg.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        shortNumber: true,
        email: true,
        address: true,
        contactName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return orgs;
  } catch (error) {
    console.error('[HUMANITARIAN_ORGS_FETCH_ERROR]', error);
    throw new Error('Failed to fetch humanitarian organizations');
  }
}

/**
 * Fetch aktivnih humanitarian organizacija (za forme)
 */
export async function getActiveHumanitarianOrgs() {
  'use cache';
  cacheLife('rare');
  cacheTag(CACHE_TAGS.HUMANITARIAN_ORGS, CACHE_TAGS.HUMANITARIAN_ORGS_LIST);

  try {
    const orgs = await db.humanitarianOrg.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        shortNumber: true,
      },
    });

    return orgs;
  } catch (error) {
    console.error('[ACTIVE_HUMANITARIAN_ORGS_FETCH_ERROR]', error);
    return [];
  }
}

/**
 * Fetch pojedinačne humanitarian organizacije
 */
export async function getHumanitarianOrgById(id: string) {
  'use cache';
  cacheLife('default');
  cacheTag(
    CACHE_TAGS.HUMANITARIAN_ORGS,
    CACHE_TAGS.HUMANITARIAN_ORG_DETAILS,
    `humanitarian-org-${id}`
  );

  try {
    const org = await db.humanitarianOrg.findUnique({
      where: { id },
      include: {
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!org) {
      throw new Error('Humanitarian organization not found');
    }

    return org;
  } catch (error) {
    console.error('[HUMANITARIAN_ORG_FETCH_ERROR]', error);
    throw error;
  }
}

/**
 * Search humanitarian organizacija po kratkom broju
 */
export async function getHumanitarianOrgByShortNumber(shortNumber: string) {
  'use cache';
  cacheLife('rare');
  cacheTag(CACHE_TAGS.HUMANITARIAN_ORGS, `humanitarian-org-short-${shortNumber}`);

  try {
    const org = await db.humanitarianOrg.findFirst({
      where: { shortNumber },
    });

    return org;
  } catch (error) {
    console.error('[HUMANITARIAN_ORG_SEARCH_ERROR]', error);
    return null;
  }
}

/**
 * Count ukupno humanitarian organizacija
 */
export async function getHumanitarianOrgsCount() {
  'use cache';
  cacheLife('rare');
  cacheTag(CACHE_TAGS.HUMANITARIAN_ORGS);

  try {
    return await db.humanitarianOrg.count();
  } catch (error) {
    console.error('[HUMANITARIAN_ORGS_COUNT_ERROR]', error);
    return 0;
  }
}