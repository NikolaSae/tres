// actions/products/delete.ts
'use server';

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/security/audit-logger";
import { getCurrentUser } from "@/lib/security/auth-helpers";

interface DeleteProductResult {
  success?: string;
  error?: string;
}

/**
 * Server action to delete a product
 * Includes proper authorization, validation, and audit logging
 */
export async function deleteProduct(productId: string): Promise<DeleteProductResult> {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized. Please log in." };
    }

    // Validate input
    if (!productId || typeof productId !== 'string') {
      return { error: "Invalid product ID provided." };
    }

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id: productId },
      include: {
        _count: {
          select: {
            complaints: true,
          }
        }
      }
    });

    if (!existingProduct) {
      return { error: "Product not found." };
    }

    // Check if product has associated complaints
    if (existingProduct._count.complaints > 0) {
      return { 
        error: `Cannot delete product "${existingProduct.name}". It has ${existingProduct._count.complaints} associated complaint(s). Please resolve or reassign the complaints first.` 
      };
    }

    // Perform the deletion
    await db.product.delete({
      where: { id: productId }
    });

    // Log the activity
    await logActivity("DELETE_PRODUCT", {
      entityType: "product",
      entityId: productId,
      details: `Product "${existingProduct.name}" (Code: ${existingProduct.code}) was deleted`,
      severity: "INFO",
      userId: user.id
    });

    // Revalidate the products list page
    revalidatePath("/products");
    
    return { success: `Product "${existingProduct.name}" has been successfully deleted.` };

  } catch (error) {
    console.error("[DELETE_PRODUCT_ERROR]", error);

    // Log the error
    try {
      await logActivity("DELETE_PRODUCT_ERROR", {
        entityType: "product",
        entityId: productId,
        details: `Failed to delete product: ${(error as Error).message}`,
        severity: "ERROR",
        userId: (await getCurrentUser())?.id || "unknown"
      });
    } catch (logError) {
      console.error("[DELETE_PRODUCT_LOG_ERROR]", logError);
    }

    // Return user-friendly error message
    if (error instanceof Error) {
      // Handle specific Prisma errors
      if (error.message.includes('foreign key constraint')) {
        return { error: "Cannot delete product due to existing relationships. Please remove associated records first." };
      }
      
      if (error.message.includes('Record to delete does not exist')) {
        return { error: "Product not found or already deleted." };
      }
    }

    return { error: "An unexpected error occurred while deleting the product. Please try again." };
  }
}

/**
 * Server action to delete multiple products
 * Useful for bulk operations
 */
export async function deleteMultipleProducts(productIds: string[]): Promise<DeleteProductResult> {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized. Please log in." };
    }

    // Validate input
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return { error: "No products selected for deletion." };
    }

    // Check for products with complaints
    const productsWithComplaints = await db.product.findMany({
      where: { 
        id: { in: productIds } 
      },
      include: {
        _count: {
          select: {
            complaints: true,
          }
        }
      }
    });

    const blockedProducts = productsWithComplaints.filter(p => p._count.complaints > 0);
    
    if (blockedProducts.length > 0) {
      const blockedNames = blockedProducts.map(p => p.name).join(", ");
      return { 
        error: `Cannot delete the following products due to associated complaints: ${blockedNames}. Please resolve complaints first.` 
      };
    }

    // Get product names for logging
    const productsToDelete = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, code: true }
    });

    if (productsToDelete.length === 0) {
      return { error: "No valid products found for deletion." };
    }

    // Perform bulk deletion
    const deleteResult = await db.product.deleteMany({
      where: { id: { in: productIds } }
    });

    // Log the activity
    await logActivity("DELETE_MULTIPLE_PRODUCTS", {
      entityType: "product",
      entityId: productIds.join(","),
      details: `Bulk deleted ${deleteResult.count} products: ${productsToDelete.map(p => `${p.name} (${p.code})`).join(", ")}`,
      severity: "INFO",
      userId: user.id
    });

    // Revalidate the products list page
    revalidatePath("/products");
    
    return { success: `Successfully deleted ${deleteResult.count} product(s).` };

  } catch (error) {
    console.error("[DELETE_MULTIPLE_PRODUCTS_ERROR]", error);

    // Log the error
    try {
      await logActivity("DELETE_MULTIPLE_PRODUCTS_ERROR", {
        entityType: "product",
        entityId: productIds?.join(",") || "unknown",
        details: `Failed to delete multiple products: ${(error as Error).message}`,
        severity: "ERROR",
        userId: (await getCurrentUser())?.id || "unknown"
      });
    } catch (logError) {
      console.error("[DELETE_MULTIPLE_PRODUCTS_LOG_ERROR]", logError);
    }

    return { error: "An unexpected error occurred while deleting products. Please try again." };
  }
}
