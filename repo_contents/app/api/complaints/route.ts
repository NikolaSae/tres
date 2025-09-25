// Path: app/api/complaints/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";


// GET - Get all complaints with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // --- Extract & Parse Filters and Pagination ---
    const filters: any = {}; // Koristimo 'any' jer dinamički gradimo filter

    // Basic filters
    const status = searchParams.get("status");
    if (status) filters.status = status;

    const priority = searchParams.get("priority");
    if (priority) {
        const priorityInt = parseInt(priority);
        if (!isNaN(priorityInt)) filters.priority = priorityInt;
    }

    const serviceId = searchParams.get("serviceId");
    if (serviceId) filters.serviceId = serviceId;

    const providerId = searchParams.get("providerId");
    if (providerId) filters.providerId = providerId;

    const productId = searchParams.get("productId");
    if (productId) filters.productId = productId;

    // Date range filters (Frontend šalje startDate i endDate)
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (startDateParam || endDateParam) {
      filters.createdAt = {};
      if (startDateParam) {
            const startDate = new Date(startDateParam);
            if (!isNaN(startDate.getTime())) filters.createdAt.gte = startDate;
        }
      if (endDateParam) {
            const endDate = new Date(endDateParam);
             // Dodajemo jedan dan da bi se uključio ceo krajnji datum
            if (!isNaN(endDate.getTime())) {
                 const endOfEndDate = new Date(endDate);
                 endOfEndDate.setDate(endOfEndDate.getDate() + 1);
                 filters.createdAt.lt = endOfEndDate; // Koristimo 'manje od' početka sledećeg dana
             }
        }
    }

    // Search filter (Frontend šalje search)
    const searchParam = searchParams.get("search");
    if (searchParam) {
        // Koristimo Prisma OR za pretragu po više tekstualnih polja
        const searchConditions = [
            { title: { contains: searchParam, mode: 'insensitive' as const } },
            { description: { contains: searchParam, mode: 'insensitive' as const } },
             // Dodajte druga tekstualna polja ako je potrebno (npr. service name, provider name, product name ako ih dohvaćate)
             // Za pretragu po povezanim relacijama, morali biste koristiti nested where uslove:
             // { service: { name: { contains: searchParam, mode: 'insensitive' as const } } },
             // { provider: { name: { contains: searchParam, mode: 'insensitive' as const } } },
             // itd.
        ];

        // Ako već postoje drugi filteri, kombinujte ih sa search filterima koristeći AND
        if (Object.keys(filters).length > 0) {
             filters.AND = [filters, { OR: searchConditions }];
             // Obrišite top-level filtere koji su sada ugnježdeni unutar AND
             Object.keys(filters).forEach(key => {
                 if (key !== 'AND') delete filters[key];
             });

        } else {
             // Ako nema drugih filtera, search je glavni OR uslov
             filters.OR = searchConditions;
        }
    }


    // Pagination (Frontend šalje page i limit)
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10"); // Pretpostavljamo 'limit' iz hooka odgovara 'pageSize'
    const skip = (page - 1) * limit;


    // --- Autorizaciono Filtriranje ---
    const isAdmin = session.user.role === UserRole.ADMIN;
    const isManager = session.user.role === UserRole.MANAGER;
    const isAgent = session.user.role === UserRole.AGENT;

    // Ako korisnik nije Admin ili Menadžer, primeni filtere bazirane na njihovoj ulozi
    if (!isAdmin && !isManager) {
        const userSpecificConditions = [];

      if (isAgent) {
          // Agent vidi pritužbe koje je podneo ILI koje su mu dodeljene
        userSpecificConditions.push(
             { submittedById: session.user.id },
             { assignedAgentId: session.user.id }
          );
      } else {
          // Podrazumevana USER uloga vidi samo pritužbe koje je podneo
        userSpecificConditions.push({ submittedById: session.user.id });
      }

        // Kombinujemo postojeće filtere sa korisnički specifičnim uslovima koristeći AND
        if (Object.keys(filters).length > 0) {
             // Ako već postoji top-level AND (npr. od searcha), dodajemo OR uslov u taj AND
             if (filters.AND) {
                 filters.AND.push({ OR: userSpecificConditions });
             } else if (filters.OR) {
                 // Ako postoji top-level OR (npr. samo od searcha), onda ga kombinujemo sa novim OR uslovom unutar AND
                 const existingOR = filters.OR;
                 filters.AND = [{ OR: existingOR }, { OR: userSpecificConditions }];
                 delete filters.OR;
             } else {
                  // Ako nema ni AND ni OR, samo dodajemo novi OR uslov
                  filters.OR = userSpecificConditions; // Ovo bi se desilo samo ako nema filtera (datum, status, search...)
                  // U praksi, verovatno uvek postoji bar defaultni search ili status, pa će pasti u gornje slučajeve
             }
        } else {
             // Ako nema NIKAKVIH filtera pre ovoga, onda se primenjuje samo korisnički specifični OR uslov
             filters.OR = userSpecificConditions;
        }
    }


    // --- Prisma Queries ---
    // Dohvati ukupan broj pritužbi sa primenjenim filterima (za paginaciju)
    const totalCount = await db.complaint.count({
      where: filters // Koristimo konačne kombinovane filtere
    });

    // Dohvati pritužbe sa primenjenim filterima, sortiranjem i paginacijom
    const complaints = await db.complaint.findMany({
      where: filters, // Koristimo konačne kombinovane filtere
      orderBy: {
        createdAt: "desc"
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        provider: {
          select: {
            id: true,
            name: true
          }
        },
        humanitarianOrg: { // Uključujemo humanitarianOrg
           select: {
             id: true,
             name: true,
           }
        },
      },
      skip,
      take: limit // Koristimo 'limit' da se poklopi sa hook parametrom
    });

    // --- Vraćamo odgovor ---
    // Vraćamo podatke u formatu koji hook očekuje
    return NextResponse.json({
      complaints,
      totalCount, // totalCount na najvišem nivou
      totalPages: Math.ceil(totalCount / limit) // totalPages na najvišem nivou
    });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json(
      { error: "Failed to fetch complaints" },
      { status: 500 }
    );
  }
}

// POST funkcija ostaje neizmenjena za sada, nije vezana za dohvatanje liste
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();

    // Uvoz complaintSchema dinamički da bi se izbegle greške pri top-level importu
    // Ako imate problema sa complaintUpdateSchema, verovatno imate isti problem i sa complaintSchema
    const { complaintSchema: importedComplaintSchema } = await import("@/schemas/complaint");

    const validatedData = importedComplaintSchema.parse(json);

    const complaint = await db.complaint.create({
      data: {
        ...validatedData,
        submittedById: session.user.id,
        statusHistory: {
          create: {
            newStatus: validatedData.status || "NEW",
            changedById: session.user.id
          }
        }
      },
      include: { // Uključujemo relacije i pri kreiranju ako želimo da ih vratimo u odgovoru
        submittedBy: {
          select: { id: true, name: true, email: true }
        },
        service: {
          select: { id: true, name: true }
        },
        product: {
          select: { id: true, name: true }
        },
        provider: {
          select: { id: true, name: true }
        }
        // Dodajte humanitarianOrg include ako ga complaintSchema podržava i ako želite da ga vidite pri kreiranju
      }
    });

    await db.activityLog.create({
      data: {
        action: "CREATE_COMPLAINT",
        entityType: "complaint",
        entityId: complaint.id,
        details: `Created complaint: ${complaint.title}`,
        severity: "INFO",
        userId: session.user.id
      }
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating complaint:", error);
    return NextResponse.json(
      { error: "Failed to create complaint" },
      { status: 500 }
    );
  }
}