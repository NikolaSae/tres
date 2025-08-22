// app/api/operators/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { operatorSchema } from "@/schemas/operator";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const operator = await db.operator.findUnique({
      where: { id },
    });

    if (!operator) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }

    return NextResponse.json(operator);
  } catch (error) {
    console.error("Error fetching operator:", error);
    return NextResponse.json({ error: "Failed to fetch operator" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    
    // Validate the request body
    const validatedData = operatorSchema.parse(body);
    
    // Check if operator exists
    const existingOperator = await db.operator.findUnique({
      where: { id },
    });
    
    if (!existingOperator) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }
    
    // If code is being changed, check if it's already in use
    if (validatedData.code !== existingOperator.code) {
      const operatorWithCode = await db.operator.findUnique({
        where: { code: validatedData.code },
      });
      
      if (operatorWithCode) {
        return NextResponse.json(
          { error: "An operator with this code already exists" }, 
          { status: 400 }
        );
      }
    }
    
    // Update the operator
    const updatedOperator = await db.operator.update({
      where: { id },
      data: validatedData,
    });
    
    return NextResponse.json(updatedOperator);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    
    console.error("Error updating operator:", error);
    return NextResponse.json({ error: "Failed to update operator" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    
    // Check if operator exists
    const existingOperator = await db.operator.findUnique({
      where: { id },
      include: {
        contracts: true,
      },
    });
    
    if (!existingOperator) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }
    
    // Check if operator has associated contracts
    if (existingOperator.contracts.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete operator with associated contracts",
          contractCount: existingOperator.contracts.length 
        }, 
        { status: 400 }
      );
    }
    
    // Delete the operator
    await db.operator.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting operator:", error);
    return NextResponse.json({ error: "Failed to delete operator" }, { status: 500 });
  }
}