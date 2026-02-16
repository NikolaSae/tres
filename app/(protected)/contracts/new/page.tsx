// app/(protected)/contracts/new/page.tsx

import { ContractForm } from "@/components/contracts/ContractForm";
import { Metadata } from "next";
import { getHumanitarianOrgs } from "@/actions/organizations/get-humanitarian";
import { getProviders } from "@/actions/providers/get-providers";
import { getParkingServices } from "@/actions/services/get-parking-services";
import { getAllOperators } from "@/actions/operators";
import { unstable_cache } from 'next/cache';

export const metadata: Metadata = {
  title: "Create New Contract | Management Dashboard",
  description: "Create a new contract in the system",
};

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Cache helper functions with proper revalidation
const getCachedHumanitarianOrgs = unstable_cache(
  async () => getHumanitarianOrgs(),
  ['humanitarian-orgs-list'],
  {
    revalidate: 600, // 10 minutes
    tags: ['humanitarian-orgs']
  }
);

const getCachedProviders = unstable_cache(
  async () => getProviders(),
  ['providers-list'],
  {
    revalidate: 300, // 5 minutes
    tags: ['providers']
  }
);

const getCachedParkingServices = unstable_cache(
  async () => getParkingServices(),
  ['parking-services-list'],
  {
    revalidate: 600, // 10 minutes
    tags: ['parking-services']
  }
);

const getCachedOperators = unstable_cache(
  async () => getAllOperators(),
  ['operators-list'],
  {
    revalidate: 300, // 5 minutes
    tags: ['operators']
  }
);

export default async function NewContractPage() {
  // Parallel fetching with cached data
  const [humanitarianOrgs, providers, parkingServices, operators] = await Promise.all([
    getCachedHumanitarianOrgs(),
    getCachedProviders(),
    getCachedParkingServices(),
    getCachedOperators(),
  ]);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Create New Contract</h1>
        <p className="text-muted-foreground">Create a new contract in the system</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <ContractForm
          humanitarianOrgs={humanitarianOrgs}
          providers={providers}
          parkingServices={parkingServices}
          operators={operators}
        />
      </div>
    </div>
  );
}