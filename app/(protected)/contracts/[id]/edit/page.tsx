// app/(protected)/contracts/[id]/edit/page.tsx
import { ContractForm } from "@/components/contracts/ContractForm";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { unstable_cache } from 'next/cache';

export async function generateMetadata(
  props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await props.params;
  try {
    const contract = await db.contract.findUnique({
      where: { id },
      select: { name: true },
    });
    if (!contract) return { title: "Contract Not Found" };
    return { title: `Edit ${contract.name} | Contract Management` };
  } catch {
    return { title: "Error Loading Contract" };
  }
}

interface EditContractPageProps {
  params: Promise<{ id: string }>;
}

// ✅ Bez try/catch — greška se propaguje do page-a
async function getContract(id: string, currentUserId: string, userRole: string) {
  const contract = await db.contract.findUnique({
    where: { id },
    include: {
      services: { include: { service: true } },
      provider: true,
      operator: true,
      humanitarianOrg: true,
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!contract) return null;

  const isAdmin = userRole === 'ADMIN';
  const isCreator = contract.createdById === currentUserId;

  if (!isAdmin && !isCreator) {
    throw new Error("Forbidden");
  }

  return {
    id: contract.id,
    name: contract.name,
    contractNumber: contract.contractNumber,
    type: contract.type,
    status: contract.status,
    startDate: contract.startDate,
    endDate: contract.endDate,
    revenuePercentage: contract.revenuePercentage,
    description: contract.description,
    providerId: contract.providerId,
    humanitarianOrgId: contract.humanitarianOrgId,
    parkingServiceId: contract.parkingServiceId,
    operatorId: contract.operatorId,
    operatorRevenue: contract.operatorRevenue,
    isRevenueSharing: contract.isRevenueSharing ?? true,
    services: contract.services.map((sc) => ({
      serviceId: sc.serviceId,
      specificTerms: sc.specificTerms || undefined,
    })),
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
    createdById: contract.createdById,
  };
}

const getCachedProviders = unstable_cache(
  async () => db.provider.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  }),
  ['providers-select-list'],
  { revalidate: 600, tags: ['providers'] }
);

const getCachedOperators = unstable_cache(
  async () => db.operator.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  }),
  ['operators-select-list'],
  { revalidate: 600, tags: ['operators'] }
);

const getCachedHumanitarianOrgs = unstable_cache(
  async () => db.humanitarianOrg.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  }),
  ['humanitarian-orgs-select-list'],
  { revalidate: 600, tags: ['humanitarian-orgs'] }
);

const getCachedParkingServices = unstable_cache(
  async () => db.parkingService.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  }),
  ['parking-services-select-list'],
  { revalidate: 600, tags: ['parking-services'] }
);

export default async function EditContractPage(props: EditContractPageProps) {
  const { id } = await props.params;
  const session = await auth();

  if (!session?.user) {
    return redirect("/auth/login");
  }

  // Uzmi userId iz sessiona — session.user.id dolazi iz JWT callback-a
  const userId = session.user.id;
  const userRole = session.user.role || '';

  if (!userId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
        <p>User identification failed. Please try logging in again.</p>
      </div>
    );
  }

  try {
    const [contract, providers, operators, humanitarianOrgs, parkingServices] =
      await Promise.all([
        getContract(id, userId, userRole),
        getCachedProviders(),
        getCachedOperators(),
        getCachedHumanitarianOrgs(),
        getCachedParkingServices(),
      ]);

    if (!contract) return notFound();

    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Contract</h1>
          <p className="text-gray-500">
            Update details for contract #{contract.contractNumber}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <ContractForm
            contract={contract}
            isEditing={true}
            providers={providers}
            operators={operators}
            humanitarianOrgs={humanitarianOrgs}
            parkingServices={parkingServices}
          />
        </div>
      </div>
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Forbidden") {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Permission Denied</h1>
          <p>You don't have permission to update this contract.</p>
        </div>
      );
    }

    console.error("[EDIT_CONTRACT_PAGE_ERROR]", error);
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">Error Loading Contract</h1>
        <p>There was an error loading the contract details. Please try again later.</p>
      </div>
    );
  }
}