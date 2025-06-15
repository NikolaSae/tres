// /app/(protected)/contracts/[id]/edit/page.tsx
import { ContractForm } from "@/components/contracts/ContractForm";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function generateMetadata(props: { params: { id: string } }): Promise<Metadata> {
  const params = await props.params; // Await the params promise
  const id = params.id;
  
  try {
    const contract = await db.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      return {
        title: "Contract Not Found",
      };
    }

    return {
      title: `Edit ${contract.name} | Contract Management`,
    };
  } catch (error) {
    return {
      title: "Error Loading Contract",
    };
  }
}

interface EditContractPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Zamenite postojeću getContract funkciju sa ovom
async function getContract(id: string, currentUserId?: string, userRole?: string) {
  try {
    const contract = await db.contract.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: true
          }
        },
        provider: true,
        operator: true,
        humanitarianOrg: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
      },
    });

    if (!contract) {
      return null;
    }

    // Debug logovi
    console.log("[GET_CONTRACT] Permission check:", {
      currentUserId,
      userRole,
      contractCreatedById: contract.createdById,
      isAdmin: userRole === 'ADMIN',
      isCreator: contract.createdById === currentUserId,
      stringComparison: String(contract.createdById) === String(currentUserId)
    });

    // FIXED: Better permission logic
    // Allow access if user is ADMIN OR if user is the creator
    const isAdmin = userRole === 'ADMIN';
    const isCreator = contract.createdById === currentUserId;
    
    if (currentUserId && !isAdmin && !isCreator) {
      console.error("[GET_CONTRACT] Permission denied:", {
        reason: "Not admin and not creator",
        userRole,
        currentUserId,
        contractCreatedById: contract.createdById,
        isAdmin,
        isCreator
      });
      throw new Error("Forbidden");
    }

    console.log("[GET_CONTRACT] Permission granted");

    return {
      ...contract,
      startDate: contract.startDate ? new Date(contract.startDate) : null,
      endDate: contract.endDate ? new Date(contract.endDate) : null,
      services: contract.services.map(sc => ({
        serviceId: sc.serviceId,
        specificTerms: sc.specificTerms,
        service: sc.service
      })),
      isRevenueSharing: contract.isRevenueSharing ?? true,
    };
  } catch (error) {
    console.error("GET_CONTRACT_ERROR", error);
    return null;
  }
}

async function getProviders() {
  return db.provider.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

async function getOperators() {
  return db.operator.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

async function getHumanitarianOrgs() {
  return db.humanitarianOrg.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

async function getParkingServices() {
  return db.service.findMany({
    where: { 
      type: 'PARKING',
      isActive: true 
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

export default async function EditContractPage(props: EditContractPageProps) {
  const params = await props.params; // Await the params promise
  const id = params.id;
  
  const session = await auth();
  console.log("[EDIT_PAGE] Complete session debugging:", {
  hasSession: !!session,
  hasUser: !!session?.user,
  userId: session?.user?.id,
  userEmail: session?.user?.email,
  userRole: (session?.user as any)?.role,
  userProps: session?.user ? Object.keys(session.user) : [],
  fullUser: session?.user,
  rawSession: session
});
  // Handle session/user state
  if (!session) {
    console.error("[EDIT_PAGE] No session found");
    return redirect("/auth/login");
  }
  
  if (!session.user) {
    console.error("[EDIT_PAGE] Session exists but no user object");
    return redirect("/auth/login");
  }
  if (session?.user?.id) {
  try {
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true, name: true }
    });
    console.log("[EDIT_PAGE] Direct DB user query:", dbUser);
  } catch (error) {
    console.error("[EDIT_PAGE] Error fetching user from DB:", error);
  }
}
  // Enhanced user ID extraction
  let userId = '';
  let userRole = '';
  
  // Try to get user data from database since session is incomplete
  if (session.user.email) {
    try {
      const dbUser = await db.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, name: true }
      });
      
      if (dbUser) {
        userId = dbUser.id;
        userRole = dbUser.role || '';
        console.log("[EDIT_PAGE] Enhanced user data from DB:", {
          userId,
          userRole,
          userName: dbUser.name
        });
      } else {
        console.error("[EDIT_PAGE] User not found in database with email:", session.user.email);
      }
    } catch (error) {
      console.error("[EDIT_PAGE] Error fetching user from DB:", error);
    }
  }
  
  // Fallback to session-based extraction if DB lookup failed
  if (!userId) {
    if (session.user.id) userId = session.user.id;
    else if ((session.user as any)?.sub) userId = (session.user as any).sub;
    else if ((session as any)?.userId) userId = (session as any).userId;
  }
  
  if (!userId) {
    console.error(
      "[EDIT_PAGE] User ID not found anywhere:", 
      JSON.stringify(session, null, 2)
    );
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
        <p>User identification failed. Please try logging in again.</p>
      </div>
    );
  }

  try {
    const [contract, providers, operators, humanitarianOrgs, parkingServices] = await Promise.all([
      getContract(id, userId, userRole), // Now passing the correct role
      getProviders(),
      getOperators(),
      getHumanitarianOrgs(),
      getParkingServices()
    ]);

    if (!contract) {
      return notFound();
    }

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
  } catch (error: any) {
    if (error.message === "Forbidden") {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Permission Denied</h1>
          <p>You don't have permission to update this contract</p>
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
