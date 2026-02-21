// app/(protected)/contracts/new/page.tsx
import { ContractForm } from "@/components/contracts/ContractForm";
import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getHumanitarianOrgs } from "@/actions/organizations/get-humanitarian";
import { getProviders } from "@/actions/providers/get-providers";
import { getParkingServices } from "@/actions/services/get-parking-services";
import { getAllOperators } from "@/actions/operators/getAllOperators";

export const metadata: Metadata = {
  title: "Create New Contract | Management Dashboard",
  description: "Create a new contract in the system",
};

export const dynamic = 'force-dynamic';

export default async function NewContractPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const [providers, parkingServices, operators, humanitarianOrgs] = await Promise.all([
    getProviders(),
    getParkingServices(),
    getAllOperators(),
    getHumanitarianOrgs(session.user.id),
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