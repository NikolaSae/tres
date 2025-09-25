///app/(protected)/contracts/new/page.tsx

import { ContractForm } from "@/components/contracts/ContractForm";
import { Metadata } from "next";
import { getHumanitarianOrgs } from "@/actions/organizations/get-humanitarian";
import { getProviders } from "@/actions/providers/get-providers";
import { getParkingServices } from "@/actions/services/get-parking-services";
import { getAllOperators } from "@/actions/operators";

export const metadata: Metadata = {
  title: "Create New Contract | Management Dashboard",
  description: "Create a new contract in the system",
};

export default async function NewContractPage() {

  const humanitarianOrgs = await getHumanitarianOrgs();
  const providers = await getProviders();
  const parkingServices = await getParkingServices();
  const operators = await getAllOperators();
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
