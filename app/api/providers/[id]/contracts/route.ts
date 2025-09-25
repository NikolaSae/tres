//app/api/providers/[id]/contracts/route.ts


import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; // Assuming you have next-auth configured
import { db } from "@/lib/db"; // Assuming you have your Prisma client instance here

// GET - Retrieve all contracts associated with a specific provider
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const session = await auth();

    // Check if the user is authenticated
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Await params before accessing its properties
    const awaitedParams = await params;
    const providerId = awaitedParams.id;

    // Optional: Check if the provider exists before fetching contracts
    // This adds an extra database call but can provide a more specific 404 error
    const provider = await db.provider.findUnique({
       where: { id: providerId },
       select: { id: true } // Only need to select the ID to confirm existence
    });

    if (!provider) {
        return new NextResponse("Provider not found", { status: 404 });
    }


    // Fetch all contracts linked to this provider ID
    const contracts = await db.contract.findMany({
      where: {
        providerId: providerId, // Filter contracts by the provider ID
      },
      include: {
        // Include relations needed by the frontend component (ProviderContracts)
        operator: { // Include operator details
           select: {
              id: true,
              name: true,
           }
        },
        // Add other includes if needed by the ProviderContracts component, e.g.:
        // parkingService: { select: { id: true, name: true } },
        // humanitarianOrg: { select: { id: true, name: true } },
      },
      // Optional: Add ordering if needed
      orderBy: {
         createdAt: 'desc' // Example: Order by creation date
      }
    });

    // Return the fetched contracts as a JSON response
    return NextResponse.json(contracts);

  } catch (error) {
    console.error("[PROVIDER_CONTRACTS_GET]", error);
    // Return a generic internal server error response
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// You can add other HTTP methods (POST, PUT, DELETE) here if needed for contracts related to a provider
// export async function POST(...) { ... }
