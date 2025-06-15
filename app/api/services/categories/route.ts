// /app/api/services/categories/route.ts
// /app/api/services/categories/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { ServiceType } from "@prisma/client";

export async function GET() {
  try {
    const session = await auth();
    
    // Enhanced session validation
    if (!session) {
      console.error('No session found');
      return new NextResponse("Unauthorized - No session", { status: 401 });
    }
    
    if (!session.user) {
      console.error('Session found but no user object');
      return new NextResponse("Unauthorized - No user", { status: 401 });
    }
    
    // Use email as fallback identifier if ID is missing
    const userId = session.user.id || session.user.email;
    
    if (!userId) {
      console.error('User object exists but ID and email are missing:', session.user);
      return new NextResponse("Unauthorized - Missing identifier", { status: 401 });
    }

    // Get all service categories (types)
    const serviceTypes = Object.values(ServiceType);
    
    // Get counts of services per category
    const servicesPerCategory = await Promise.all(
      serviceTypes.map(async (type) => {
        const count = await db.service.count({
          where: {
            type,
            isActive: true,
          },
        });
        return { type, count };
      })
    );
    
    // Get sample services for each category
    const servicesWithSamples = await Promise.all(
      serviceTypes.map(async (type) => {
        const services = await db.service.findMany({
          where: {
            type,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
          },
          take: 5,
        });
        return {
          type,
          count: servicesPerCategory.find(c => c.type === type)?.count || 0,
          samples: services,
        };
      })
    );
    
    // Add complaint counts only for admins/managers
    if (session.user.role === "ADMIN" || session.user.role === "MANAGER") {
      const complaintCountsByServiceType = await Promise.all(
        serviceTypes.map(async (type) => {
          const complaints = await db.complaint.count({
            where: {
              service: {
                type,
              },
            },
          });
          return { type, complaintCount: complaints };
        })
      );
      
      // Merge complaint counts
      servicesWithSamples.forEach(category => {
        category.complaintCount = complaintCountsByServiceType.find(
          c => c.type === category.type
        )?.complaintCount || 0;
      });
    }

    // Return structured response
    return NextResponse.json({
      categories: serviceTypes,
      services: servicesWithSamples.flatMap(category => category.samples)
    });
  } catch (error) {
    console.error("[SERVICE_CATEGORIES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}