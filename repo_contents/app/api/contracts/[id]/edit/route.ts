// /app/api/contracts/[id]/edit/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { updateContract } from '@/actions/contracts/update';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Await the params promise
    const params = await context.params;
    const { id } = params;

    console.log("[API_EDIT_ROUTE] Processing update for contract:", id);

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      console.error("[API_EDIT_ROUTE] No session found");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate contract ID
    if (!id || typeof id !== 'string') {
      console.error("[API_EDIT_ROUTE] Invalid contract ID:", id);
      return NextResponse.json({ error: 'Invalid contract ID format' }, { status: 400 });
    }

    // Parse request body
    let requestData;
    try {
      requestData = await request.json();
      console.log("[API_EDIT_ROUTE] Request data received:", {
        keys: Object.keys(requestData),
        hasData: !!requestData
      });
    } catch (parseError) {
      console.error("[API_EDIT_ROUTE] Error parsing request body:", parseError);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Call the update action
    const result = await updateContract(id, requestData);

    if (result.error) {
      console.error("[API_EDIT_ROUTE] Update failed:", result.error);
      
      // Handle specific error types
      if (result.error === "Contract not found") {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      
      if (result.error === "Authentication required") {
        return NextResponse.json({ error: result.error }, { status: 401 });
      }
      
      if (result.error === "You don't have permission to update this contract") {
        return NextResponse.json({ error: result.error }, { status: 403 });
      }
      
      // Generic error
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log("[API_EDIT_ROUTE] Update successful for contract:", id);
    
    return NextResponse.json({
      success: true,
      message: 'Contract updated successfully',
      contract: result.contract
    }, { status: 200 });

  } catch (error) {
    console.error("[API_EDIT_ROUTE] Unexpected error:", error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('ECONNRESET')) {
        return NextResponse.json({ 
          error: 'Database connection lost. Please try again.' 
        }, { status: 503 });
      }
      
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ 
          error: 'Contract with this number already exists' 
        }, { status: 409 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Internal server error occurred while updating contract' 
    }, { status: 500 });
  }
}