// app/api/providers/[id]/edit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Define a schema for the update data
// This should match the fields you expect to update from the frontend form
const updateProviderSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  contactName: z.string().nullable().optional(),
  email: z.string().email({ message: "Invalid email format." }).nullable().optional().or(z.literal("")), // Allow empty string for optional email
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
  imageUrl: z.string().url({ message: "Invalid URL format." }).nullable().optional().or(z.literal("")), // Allow empty string for optional imageUrl
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const user = session?.user;

    // Check authorization
    if (!user || ![UserRole.ADMIN, UserRole.MANAGER].includes(user.role as UserRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const providerId = params.id;
    if (!providerId) {
        return NextResponse.json({ error: "Provider ID is missing" }, { status: 400 });
    }

    const body = await req.json();

    // Validate the request body
    const validationResult = updateProviderSchema.safeParse(body);

    if (!validationResult.success) {
        console.error("Provider update validation failed:", validationResult.error.errors);
        return NextResponse.json({ error: "Invalid input data", details: validationResult.error.errors }, { status: 400 });
    }

    const updateData = validationResult.data;

    // Find the existing provider to ensure it exists
     const existingProvider = await db.provider.findUnique({
         where: { id: providerId },
     });

     if (!existingProvider) {
         return NextResponse.json({ error: "Provider not found" }, { status: 404 });
     }


    // Update the provider in the database
    const updatedProvider = await db.provider.update({
      where: { id: providerId },
      data: {
        ...updateData,
        // Ensure optional fields that are empty strings are saved as null in DB if schema allows
        contactName: updateData.contactName === '' ? null : updateData.contactName,
        email: updateData.email === '' ? null : updateData.email,
        phone: updateData.phone === '' ? null : updateData.phone,
        address: updateData.address === '' ? null : updateData.address,
        description: updateData.description === '' ? null : updateData.description,
        imageUrl: updateData.imageUrl === '' ? null : updateData.imageUrl,
      },
    });

    // Revalidate paths related to providers
    revalidatePath("/providers"); // Revalidate the provider list page
    revalidatePath(`/providers/${providerId}`); // Revalidate the specific provider details page

    return NextResponse.json({ success: true, data: updatedProvider });

  } catch (error) {
    console.error("Provider PATCH API error:", error);
    return NextResponse.json(
      { error: "Failed to update provider" },
      { status: 500 }
    );
  }
}
