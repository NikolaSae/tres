// actions/operators/update.ts

"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { OperatorFormValues } from "@/lib/types/operator-types";
import { operatorSchema } from "@/schemas/operator";
import { revalidatePath } from "next/cache";

export async function updateOperator(id: string, data: OperatorFormValues) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { error: "Unauthorized" };
    }
    
    // Validate form data
    const validatedData = operatorSchema.safeParse(data);
    
    if (!validatedData.success) {
      return { error: "Invalid operator data", errors: validatedData.error.format() };
    }
    
    const { name, code, description, logoUrl, website, contactEmail, contactPhone, active } = validatedData.data;
    
    // Check if operator with the same code already exists (excluding current)
    const existingOperator = await db.operator.findFirst({
      where: {
        code,
        id: { not: id }
      },
    });
    
    if (existingOperator) {
      return { error: "An operator with this code already exists" };
    }
    
    // Update the operator
    const operator = await db.operator.update({
      where: { id },
      data: {
        name,
        code,
        description,
        logoUrl,
        website,
        contactEmail,
        contactPhone,
        active: active ?? true,
      },
    });
    
    // Revalidate the operators list
    revalidatePath("/operators");
    revalidatePath(`/operators/${id}`);
    
    return { success: true, data: operator };
    
  } catch (error) {
    console.error("Error updating operator:", error);
    return { error: "Failed to update operator" };
  }
}