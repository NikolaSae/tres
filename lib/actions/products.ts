// lib/actions/products.ts - NOVI FAJL (kreirati)
'use server';

import { db } from '@/lib/db';
import { productSchema, ProductFormData } from '@/schemas/product';
import { auth } from '@/auth';
import { currentRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function createProduct(data: ProductFormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const role = await currentRole();
    if (role !== UserRole.ADMIN && role !== UserRole.MANAGER) {
      return { error: 'Forbidden' };
    }

    const validatedData = productSchema.parse(data);

    const product = await db.product.create({
      data: validatedData,
    });

    return { 
      success: 'Product created successfully', 
      id: product.id 
    };
  } catch (error) {
    console.error('Error creating product:', error);
    return { error: 'Failed to create product' };
  }
}

export async function updateProduct(id: string, data: ProductFormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const role = await currentRole();
    if (role !== UserRole.ADMIN && role !== UserRole.MANAGER) {
      return { error: 'Forbidden' };
    }

    const validatedData = productSchema.parse(data);

    const product = await db.product.update({
      where: { id },
      data: validatedData,
    });

    return { 
      success: 'Product updated successfully', 
      id: product.id 
    };
  } catch (error) {
    console.error('Error updating product:', error);
    return { error: 'Failed to update product' };
  }
}