///app/api/analytics/sales/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const providerId = searchParams.get("providerId");
    const serviceId = searchParams.get("serviceId");
    
    // Parse time period
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        mesec_pruzanja_usluge: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }
    
    // Build query filters
    const filters: any = { ...dateFilter };
    if (providerId) filters.provajderId = providerId;
    if (serviceId) filters.serviceId = serviceId;
    
    // Get sales data
    const vasServiceSales = await db.vasService.findMany({
      where: filters,
      include: {
        service: true,
        provider: true,
      },
      orderBy: {
        mesec_pruzanja_usluge: "asc",
      },
    });
    
    // Group sales data by month
    const monthlySales = vasServiceSales.reduce((acc, sale) => {
      const month = sale.mesec_pruzanja_usluge.toISOString().slice(0, 7); // YYYY-MM format
      if (!acc[month]) {
        acc[month] = {
          month,
          transactions: 0,
          revenue: 0,
          collectedAmount: 0,
          uncollectedAmount: 0,
        };
      }
      
      acc[month].transactions += sale.broj_transakcija;
      acc[month].revenue += sale.fakturisan_iznos;
      acc[month].collectedAmount += sale.naplacen_iznos;
      acc[month].uncollectedAmount += sale.nenaplacen_iznos;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Convert to array and sort by month
    const salesData = Object.values(monthlySales).sort((a, b) => 
      a.month.localeCompare(b.month)
    );
    
    // Calculate total statistics
    const totalStats = {
      totalTransactions: vasServiceSales.reduce((sum, sale) => sum + sale.broj_transakcija, 0),
      totalRevenue: vasServiceSales.reduce((sum, sale) => sum + sale.fakturisan_iznos, 0),
      totalCollected: vasServiceSales.reduce((sum, sale) => sum + sale.naplacen_iznos, 0),
      totalUncollected: vasServiceSales.reduce((sum, sale) => sum + sale.nenaplacen_iznos, 0),
      collectionRate: 0,
    };
    
    // Calculate collection rate
    if (totalStats.totalRevenue > 0) {
      totalStats.collectionRate = (totalStats.totalCollected / totalStats.totalRevenue) * 100;
    }
    
    return NextResponse.json({
      salesData,
      totalStats,
    });
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales analytics" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    
    // Check if user has permission
    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
    
    // Parse request body
    const data = await request.json();
    
    // Filter options
    const {
      startDate,
      endDate,
      providerId,
      serviceId,
      groupBy,
      includeProductDetails,
    } = data;
    
    // Parse time period
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        mesec_pruzanja_usluge: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }
    
    // Build query filters
    const filters: any = { ...dateFilter };
    if (providerId) filters.provajderId = providerId;
    if (serviceId) filters.serviceId = serviceId;
    
    // Get sales data
    const vasServiceSales = await db.vasService.findMany({
      where: filters,
      include: {
        service: true,
        provider: true,
      },
    });
    
    // Process and group data based on groupBy parameter
    let groupedData: Record<string, any> = {};
    
    switch (groupBy) {
      case "provider":
        // Group by provider
        groupedData = vasServiceSales.reduce((acc, sale) => {
          const providerId = sale.provider.id;
          const providerName = sale.provider.name;
          
          if (!acc[providerId]) {
            acc[providerId] = {
              providerId,
              providerName,
              transactions: 0,
              revenue: 0,
              collectedAmount: 0,
              uncollectedAmount: 0,
              products: {},
            };
          }
          
          acc[providerId].transactions += sale.broj_transakcija;
          acc[providerId].revenue += sale.fakturisan_iznos;
          acc[providerId].collectedAmount += sale.naplacen_iznos;
          acc[providerId].uncollectedAmount += sale.nenaplacen_iznos;
          
          // Track product details if requested
          if (includeProductDetails) {
            const product = sale.proizvod;
            if (!acc[providerId].products[product]) {
              acc[providerId].products[product] = {
                transactions: 0,
                revenue: 0,
              };
            }
            acc[providerId].products[product].transactions += sale.broj_transakcija;
            acc[providerId].products[product].revenue += sale.fakturisan_iznos;
          }
          
          return acc;
        }, {} as Record<string, any>);
        break;
        
      case "service":
        // Group by service
        groupedData = vasServiceSales.reduce((acc, sale) => {
          const serviceId = sale.service.id;
          const serviceName = sale.service.name;
          
          if (!acc[serviceId]) {
            acc[serviceId] = {
              serviceId,
              serviceName,
              transactions: 0,
              revenue: 0,
              collectedAmount: 0,
              uncollectedAmount: 0,
            };
          }
          
          acc[serviceId].transactions += sale.broj_transakcija;
          acc[serviceId].revenue += sale.fakturisan_iznos;
          acc[serviceId].collectedAmount += sale.naplacen_iznos;
          acc[serviceId].uncollectedAmount += sale.nenaplacen_iznos;
          
          return acc;
        }, {} as Record<string, any>);
        break;
        
      case "product":
        // Group by product
        groupedData = vasServiceSales.reduce((acc, sale) => {
          const product = sale.proizvod;
          
          if (!acc[product]) {
            acc[product] = {
              product,
              transactions: 0,
              revenue: 0,
              collectedAmount: 0,
              uncollectedAmount: 0,
            };
          }
          
          acc[product].transactions += sale.broj_transakcija;
          acc[product].revenue += sale.fakturisan_iznos;
          acc[product].collectedAmount += sale.naplacen_iznos;
          acc[product].uncollectedAmount += sale.nenaplacen_iznos;
          
          return acc;
        }, {} as Record<string, any>);
        break;
        
      default:
        // Default to monthly grouping
        groupedData = vasServiceSales.reduce((acc, sale) => {
          const month = sale.mesec_pruzanja_usluge.toISOString().slice(0, 7); // YYYY-MM format
          
          if (!acc[month]) {
            acc[month] = {
              month,
              transactions: 0,
              revenue: 0,
              collectedAmount: 0,
              uncollectedAmount: 0,
            };
          }
          
          acc[month].transactions += sale.broj_transakcija;
          acc[month].revenue += sale.fakturisan_iznos;
          acc[month].collectedAmount += sale.naplacen_iznos;
          acc[month].uncollectedAmount += sale.nenaplacen_iznos;
          
          return acc;
        }, {} as Record<string, any>);
    }
    
    // Convert to array
    const salesData = Object.values(groupedData);
    
    // Calculate totals
    const totalStats = {
      totalTransactions: vasServiceSales.reduce((sum, sale) => sum + sale.broj_transakcija, 0),
      totalRevenue: vasServiceSales.reduce((sum, sale) => sum + sale.fakturisan_iznos, 0),
      totalCollected: vasServiceSales.reduce((sum, sale) => sum + sale.naplacen_iznos, 0),
      totalUncollected: vasServiceSales.reduce((sum, sale) => sum + sale.nenaplacen_iznos, 0),
    };
    
    return NextResponse.json({
      salesData,
      totalStats,
      groupBy: groupBy || "month",
    });
  } catch (error) {
    console.error("Error processing sales analytics:", error);
    return NextResponse.json(
      { error: "Failed to process sales analytics" },
      { status: 500 }
    );
  }
}