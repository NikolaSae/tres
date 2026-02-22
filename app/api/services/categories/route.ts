// /app/api/services/categories/route.ts
import { connection } from 'next/server';
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { ServiceType } from "@prisma/client";

type ServiceCategoryWithSamples = {
  type: ServiceType;
  count: number;
  samples: {
    id: string;
    name: string;
    type: ServiceType;
    description: string | null;
  }[];
  complaintCount?: number;
};

export async function GET() {
  await connection();

  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id || session.user.email;
    if (!userId) {
      return new NextResponse("Unauthorized - Missing identifier", { status: 401 });
    }

    const serviceTypes = Object.values(ServiceType);

    const servicesPerCategory = await Promise.all(
      serviceTypes.map(async (type) => {
        const count = await db.service.count({
          where: { type, isActive: true },
        });
        return { type, count };
      })
    );

    const servicesWithSamples: ServiceCategoryWithSamples[] = await Promise.all(
      serviceTypes.map(async (type) => {
        const services = await db.service.findMany({
          where: { type, isActive: true },
          select: { id: true, name: true, description: true, type: true },
          take: 5,
        });
        return {
          type,
          count: servicesPerCategory.find(c => c.type === type)?.count || 0,
          samples: services,
        };
      })
    );

    if (session.user.role === "ADMIN" || session.user.role === "MANAGER") {
      const complaintCountsByServiceType = await Promise.all(
        serviceTypes.map(async (type) => {
          const complaintCount = await db.complaint.count({
            where: { service: { type } },
          });
          return { type, complaintCount };
        })
      );

      servicesWithSamples.forEach(category => {
        category.complaintCount = complaintCountsByServiceType.find(
          c => c.type === category.type
        )?.complaintCount || 0;
      });
    }

    return NextResponse.json({
      categories: serviceTypes,
      services: servicesWithSamples.flatMap(category => category.samples)
    });

  } catch (error) {
    console.error("[SERVICE_CATEGORIES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}