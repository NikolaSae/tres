// app/api/admin/mcp/users/route.ts
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role || '')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return Response.json({ 
        error: 'Email parameter required',
        user: null 
      }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        isActive: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true
      }
    });

    if (!user) {
      return Response.json({ 
        message: 'User not found',
        user: null 
      }, { status: 404 });
    }

    return Response.json({ user });
    
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return Response.json({ 
      error: 'Internal server error',
      user: null 
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email, updates } = await req.json();
    
    if (!email || !updates) {
      return Response.json({ 
        error: 'Email and updates required' 
      }, { status: 400 });
    }

    // Validacija dozvoljenih update polja
    const allowedFields = ['name', 'role', 'isActive'];
    const filteredUpdates: any = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return Response.json({ 
        error: 'No valid fields to update' 
      }, { status: 400 });
    }

    const user = await db.user.update({
      where: { email: email.toLowerCase().trim() },
      data: {
        ...filteredUpdates,
        updatedAt: new Date()
      },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return Response.json({ 
      user,
      message: 'User updated successfully' 
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    
    // Type guard za Prisma error
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return Response.json({ 
          error: 'User not found' 
        }, { status: 404 });
      }
    }
    
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}