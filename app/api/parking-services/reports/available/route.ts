// app/api/parking-services/reports/available/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { promises as fs } from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const PARKING_REPORTS_BASE = path.join(PROJECT_ROOT, 'public', 'parking-service');

/**
 * Normalizuje naziv servisa za upotrebu u putanji fajlova
 * Primer: "Parking Aleksandrovac" -> "aleksandrovac"
 */
function normalizeServiceName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Detektuje tip izveštaja iz imena fajla
 * MicropaymentMerchantReport izveštaji su PREPAID
 */
function detectReportType(filename: string): 'PREPAID' | 'POSTPAID' | 'UNKNOWN' {
  const lower = filename.toLowerCase();
  
  // Explicit markers
  if (lower.includes('prepaid') || lower.includes('pre-paid') || lower.includes('pre_paid')) {
    return 'PREPAID';
  }
  
  if (lower.includes('postpaid') || lower.includes('post-paid') || lower.includes('post_paid')) {
    return 'POSTPAID';
  }
  
  // MicropaymentMerchantReport su PREPAID izveštaji
  if (lower.includes('micropaymentmerchantreport') || lower.includes('merchantreport')) {
    return 'PREPAID';
  }
  
  // Default je PREPAID
  return 'PREPAID';
}

export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user?.email) {
    console.error("🔒 Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { serviceIds, year, month, type } = await req.json();
    
    console.log("📊 Fetching available reports:", { serviceIds, year, month, type });
    
    if (!serviceIds || !year || !month) {
      console.error("❌ Missing parameters:", { 
        hasServiceIds: !!serviceIds, 
        hasYear: !!year, 
        hasMonth: !!month 
      });
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Format month without leading zero (8 instead of 08)
    const monthStr = parseInt(month).toString();
    
    console.log(`📅 Formatted month: ${monthStr} (original: ${month})`);

    const reports: Record<string, any[]> = {};

    // Get parking service names from database
    const { db } = await import("@/lib/db");
    const services = await db.parkingService.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true }
    });

    console.log(`🏢 Found ${services.length} services:`, services.map(s => s.name));

    for (const service of services) {
      console.log(`\n🔍 Processing service: ${service.name} (${service.id})`);
      
      // Normalizuj naziv (lowercase, bez razmaka)
      const normalizedName = normalizeServiceName(service.name);
      console.log(`📝 Normalized name: "${service.name}" -> "${normalizedName}"`);
      
      // Build path: public/parking-service/{normalized-name}/report/{year}/{month}/original
      const servicePath = path.join(PARKING_REPORTS_BASE, normalizedName, 'report', year, monthStr, 'original');
      console.log(`📁 Checking path: ${servicePath}`);
      
      try {
        // Check if directory exists
        await fs.access(servicePath);
        console.log(`✅ Directory exists: ${servicePath}`);
        
        const files = await fs.readdir(servicePath);
        console.log(`📄 Found ${files.length} files:`, files);
        
        const serviceReports = [];
        
        for (const file of files) {
          // Only process Excel files
          if (!file.endsWith('.xlsx') && !file.endsWith('.xls')) {
            console.log(`⏭️  Skipping non-Excel file: ${file}`);
            continue;
          }
          
          const filePath = path.join(servicePath, file);
          const stats = await fs.stat(filePath);
          
          // Determine report type from filename
          const reportType = detectReportType(file);
          console.log(`📝 File: ${file}`);
          console.log(`   Type: ${reportType}, Size: ${(stats.size / 1024).toFixed(2)} KB`);
          
          // Filter by type if specified
          if (type && type !== 'BOTH' && reportType !== type) {
            console.log(`⏭️  Skipping - doesn't match type filter (${type})`);
            continue;
          }
          
          serviceReports.push({
            path: filePath,
            name: file,
            size: stats.size,
            month: monthStr,
            year,
            type: reportType
          });
          
          console.log(`✅ Added report to queue`);
        }
        
        reports[service.id] = serviceReports;
        console.log(`📊 Total reports for ${service.name}: ${serviceReports.length}`);
        
      } catch (error: any) {
        console.error(`❌ Error accessing ${servicePath}:`, error.message);
        console.error(`   Make sure the directory exists and has proper permissions`);
        reports[service.id] = [];
      }
    }

    const totalReports = Object.values(reports).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`\n✅ SUMMARY: Total reports found: ${totalReports}`);
    
    if (totalReports === 0) {
      console.warn(`⚠️  No reports found. Check:`);
      console.warn(`   1. Directory structure: public/parking-service/{lowercase-name}/report/{year}/{month}/original`);
      console.warn(`   2. File extensions: .xls or .xlsx`);
      console.warn(`   3. Permissions on directories`);
    }

    return NextResponse.json({ success: true, reports });
    
  } catch (error: any) {
    console.error("💥 Error fetching available reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports: " + error.message },
      { status: 500 }
    );
  }
}