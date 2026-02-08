// /app/api/products/[id]/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { updateProduct } from '@/actions/products/update';
import { deleteProduct } from '@/actions/products/delete';
import { productSchema, ProductFormData } from '@/schemas/product';
import { ProductWithDetails } from '@/lib/types/product-types';
import { auth } from '@/auth';
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Handler za GET za dohvatanje pojedinačnog proizvoda po ID-u
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ProductWithDetails | { error: string }>> {
     const session = await auth();
     if (!session?.user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

    const { id } = await params;

    try {
        const product = await db.product.findUnique({
            where: { id },
             include: {
                 complaints: {
                      select: {
                           id: true,
                           title: true,
                           status: true,
                           createdAt: true,
                       },
                      orderBy: { createdAt: 'desc' }
                 },
                 _count: {
                      select: { complaints: true }
                 }
            }
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found." }, { status: 404 });
        }

        return NextResponse.json(product as ProductWithDetails, { status: 200 });

    } catch (error) {
        console.error(`Error fetching product with ID ${id} via API:`, error);
         if (error instanceof PrismaClientKnownRequestError) {
              if (error.code === 'P2025') {
                   return NextResponse.json({ error: `Product with ID ${id} not found (Prisma error).` }, { status: 404 });
              }
         }
        return NextResponse.json({ error: "Failed to fetch product." }, { status: 500 });
    }
}

// Handler za PUT za ažuriranje proizvoda po ID-u
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
     const role = await currentRole();
     if (role !== UserRole.ADMIN && role !== UserRole.MANAGER) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     }

    const { id } = await params;

    try {
        const values: ProductFormData = await request.json();

         const validationResult = productSchema.safeParse(values);
         if (!validationResult.success) {
              console.error(`Product API PUT validation failed for ID ${id}:`, validationResult.error.errors);
              return NextResponse.json({ error: "Invalid product data.", details: validationResult.error.errors }, { status: 400 });
         }

         const result = await updateProduct(id, validationResult.data);

        if (result.error) {
             if (result.error === "Forbidden") return NextResponse.json({ error: result.error }, { status: 403 });
             if (result.error.includes("not found")) {
                return NextResponse.json({ error: result.error }, { status: 404 });
             }
             if (result.details) {
                 return NextResponse.json({ error: result.error, details: result.details }, { status: 400 });
             }
             if (result.error.includes("already exists")) {
                  return NextResponse.json({ error: result.error }, { status: 409 });
             }
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: result.success, id: result.id }, { status: 200 });

    } catch (error) {
        console.error(`Error updating product with ID ${id} via API:`, error);
        return NextResponse.json({ error: "Failed to update product." }, { status: 500 });
    }
}

// Handler za DELETE za brisanje proizvoda po ID-u
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
     const role = await currentRole();
     if (role !== UserRole.ADMIN) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     }

    const { id } = await params;

    try {
         const result = await deleteProduct(id);

        if (result.error) {
             if (result.error === "Forbidden") return NextResponse.json({ error: result.error }, { status: 403 });
             if (result.error.includes("not found")) {
                return NextResponse.json({ error: result.error }, { status: 404 });
             }
             if (result.error.includes("Cannot delete product because it is associated")) {
                return NextResponse.json({ error: result.error }, { status: 409 });
             }
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: result.success }, { status: 200 });

    } catch (error) {
        console.error(`Error deleting product with ID ${id} via API:`, error);
        return NextResponse.json({ error: "Failed to delete product." }, { status: 500 });
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, { status: 200 });
}