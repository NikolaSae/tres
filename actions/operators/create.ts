// actions/operators/create.ts

"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { operatorSchema, type OperatorFormValues } from "@/schemas/operator";
import { revalidatePath } from "next/cache";

export async function createOperator(data: OperatorFormValues) {
  console.log("[CREATE_OPERATOR] Function called with data:", data);
  
  try {
    const session = await auth();
    
    if (!session?.user) {
      console.log("[CREATE_OPERATOR] No session found");
      return { error: "Unauthorized" };
    }

    console.log("[CREATE_OPERATOR] User authenticated:", session.user.email);
    
    // Validate form data
    const validatedData = operatorSchema.safeParse(data);
    
    if (!validatedData.success) {
      console.log("[CREATE_OPERATOR] Validation failed:", validatedData.error.format());
      return { 
        error: "Invalid operator data", 
        details: validatedData.error.format() 
      };
    }

    console.log("[CREATE_OPERATOR] Data validated successfully");
    
    const { name, code, description, logoUrl, website, contactEmail, contactPhone, active } = validatedData.data;
    
    // Check if operator with the same code already exists
    const existingOperator = await db.operator.findUnique({
      where: { code },
    });
    
    if (existingOperator) {
      console.log("[CREATE_OPERATOR] Operator with code already exists:", code);
      return { error: "An operator with this code already exists" };
    }
    
    console.log("[CREATE_OPERATOR] Creating operator in database");
    
    // Create the operator
    const operator = await db.operator.create({
      data: {
        name,
        code,
        description: description || null,
        logoUrl: logoUrl || null,
        website: website || null,
        contactEmail,
        contactPhone,
        active: active ?? true,
      },
    });

    console.log("[CREATE_OPERATOR] Operator created successfully:", operator.id);
    
    // Revalidate the operators list
    revalidatePath("/operators");
    
    return { success: true, data: operator };
    
  } catch (error) {
    console.error("[CREATE_OPERATOR] Error creating operator:", error);
    return { error: "Failed to create operator. Please try again." };
  }
}