// actions/operators/delete.ts


"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function deleteOperator(operatorId: string) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Check if the user has admin role
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return { error: "Insufficient permissions" };
    }
    
    // Check if the operator exists
    const existingOperator = await db.operator.findUnique({
      where: { id: operatorId },
      include: {
        contracts: true
      }
    });
    
    if (!existingOperator) {
      return { error: "Operator not found" };
    }
    
    // Check if operator has associated contracts
    if (existingOperator.contracts.length > 0) {
      return { 
        error: "Cannot delete operator with associated contracts", 
        contracts: existingOperator.contracts.length 
      };
    }
    
    // Delete the operator
    await db.operator.delete({
      where: { id: operatorId },
    });
    
    // Revalidate the operators list
    revalidatePath("/operators");
    
    return { success: true };
    
  } catch (error) {
    console.error("Error deleting operator:", error);
    return { error: "Failed to delete operator" };
  }
}