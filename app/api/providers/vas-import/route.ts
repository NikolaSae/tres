// app/api/providers/vas-import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';

// Helper function to detect and extract data from different Excel formats
function parseExcelData(workbook: XLSX.WorkBook): any[] {
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Get raw data without parsing headers
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  // Detect format by checking first few rows
  let headerRowIndex = -1;
  
  // Look for the header row (contains "Proizvod" or "proizvod")
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    if (row && row.length > 0) {
      const firstCell = String(row[0]).toLowerCase();
      if (firstCell.includes('proizvod') || row.some((cell: any) => 
        String(cell).toLowerCase().includes('proizvod')
      )) {
        headerRowIndex = i;
        break;
      }
    }
  }
  
  if (headerRowIndex === -1) {
    // Fallback: try default JSON parsing
    return XLSX.utils.sheet_to_json(worksheet);
  }
  
  // Extract headers from detected row
  const headers = rawData[headerRowIndex].map((h: any) => 
    String(h || '').trim().toLowerCase()
  );
  
  // Map column names to standardized format
  const columnMapping: Record<string, string> = {
    'proizvod': 'proizvod',
    'mesec pružanja usluge': 'mesec_pruzanja_usluge',
    'mesec pruzanja usluge': 'mesec_pruzanja_usluge',
    'jedinična cena': 'jedinicna_cena',
    'jedinicna cena': 'jedinicna_cena',
    'broj transakcija': 'broj_transakcija',
    'fakturisan iznos': 'fakturisan_iznos',
    'fakturisan korigovan iznos': 'fakturisan_korigovan_iznos',
    'naplaćen iznos': 'naplacen_iznos',
    'naplacen iznos': 'naplacen_iznos',
    'kumulativ naplaćenih iznosa': 'kumulativ_naplacenih_iznosa',
    'kumulativ naplacenih iznosa': 'kumulativ_naplacenih_iznosa',
    'nenaplaćen iznos': 'nenaplacen_iznos',
    'nenaplacen iznos': 'nenaplacen_iznos',
    'nenaplaćen korigovan iznos': 'nenaplacen_korigovan_iznos',
    'nenaplacen korigovan iznos': 'nenaplacen_korigovan_iznos',
    'storniran iznos': 'storniran_iznos',
    'storniran iznos u tekućem mesecu': 'storniran_iznos',
    'storniran iznos u tekucem mesecu': 'storniran_iznos',
    'storniran iznos u tekućem mesecu iz perioda praćenja': 'storniran_iznos',
    'otkazan iznos': 'otkazan_iznos',
    'kumulativ otkazanih iznosa': 'kumulativ_otkazanih_iznosa',
    'iznos za prenos sredstava': 'iznos_za_prenos_sredstava',
    'iznos za prenos sredstava*': 'iznos_za_prenos_sredstava',
  };
  
  // Convert data rows to objects
  const dataStartIndex = headerRowIndex + 1;
  const parsedData: any[] = [];
  
  for (let i = dataStartIndex; i < rawData.length; i++) {
    const row = rawData[i];
    
    // Skip empty rows
    if (!row || row.length === 0 || !row[0]) continue;
    
    // Skip rows that look like formula explanations (e.g., "1", "2", "3", "5=3*4")
    const firstCell = String(row[0]).trim();
    if (/^[\d]+$/.test(firstCell) && firstCell.length < 3) continue;
    
    // Map row data to object using headers
    const rowData: any = {};
    headers.forEach((header, index) => {
      const mappedKey = columnMapping[header] || header;
      if (mappedKey && row[index] !== undefined && row[index] !== null && row[index] !== '') {
        rowData[mappedKey] = row[index];
      }
    });
    
    // Only add rows with required data
    if (rowData.proizvod && rowData.mesec_pruzanja_usluge) {
      parsedData.push(rowData);
    }
  }
  
  return parsedData;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { uploadedFilePath, providerId } = body;

    if (!uploadedFilePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Verify provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { id: true, name: true }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Read Excel file
    const fileBuffer = await fs.readFile(uploadedFilePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // Parse data with smart header detection
    const data = parseExcelData(workbook);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No valid data found in Excel file. Please check file format.' },
        { status: 400 }
      );
    }

    console.log(`📊 Parsed ${data.length} rows from Excel file`);
    console.log('📋 Sample row:', data[0]);

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each row
    for (const rowData of data) {
      try {
        // Validate required fields
        if (!rowData.proizvod || !rowData.mesec_pruzanja_usluge) {
          failed++;
          errors.push(`Missing required fields: proizvod or mesec_pruzanja_usluge`);
          continue;
        }

        // Find or create service
        let service = await prisma.service.findFirst({
          where: {
            name: rowData.proizvod,
            type: 'VAS'
          }
        });

        if (!service) {
          service = await prisma.service.create({
            data: {
              name: rowData.proizvod,
              type: 'VAS',
              isActive: true,
              createdById: session.user.id,
            }
          });
        }

        // Parse date - handle both "09.2024" and full date formats
        let serviceDate: Date;
        const dateStr = String(rowData.mesec_pruzanja_usluge);
        
        if (dateStr.includes('.')) {
          // Format: "09.2024" or "12.2024"
          const [month, year] = dateStr.split('.');
          serviceDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        } else {
          // Try standard date parsing
          serviceDate = new Date(dateStr);
        }

        if (isNaN(serviceDate.getTime())) {
          failed++;
          errors.push(`Invalid date format: ${dateStr}`);
          continue;
        }

        // Create or update VAS service entry
        await prisma.vasService.upsert({
          where: {
            proizvod_mesec_pruzanja_usluge_provajderId: {
              proizvod: rowData.proizvod,
              mesec_pruzanja_usluge: serviceDate,
              provajderId: providerId,
            }
          },
          create: {
            proizvod: rowData.proizvod,
            mesec_pruzanja_usluge: serviceDate,
            jedinicna_cena: parseFloat(rowData.jedinicna_cena) || 0,
            broj_transakcija: parseInt(rowData.broj_transakcija) || 0,
            fakturisan_iznos: parseFloat(rowData.fakturisan_iznos) || 0,
            fakturisan_korigovan_iznos: parseFloat(rowData.fakturisan_korigovan_iznos) || 0,
            naplacen_iznos: parseFloat(rowData.naplacen_iznos) || 0,
            kumulativ_naplacenih_iznosa: parseFloat(rowData.kumulativ_naplacenih_iznosa) || 0,
            nenaplacen_iznos: parseFloat(rowData.nenaplacen_iznos) || 0,
            nenaplacen_korigovan_iznos: parseFloat(rowData.nenaplacen_korigovan_iznos) || 0,
            storniran_iznos: parseFloat(rowData.storniran_iznos) || 0,
            otkazan_iznos: parseFloat(rowData.otkazan_iznos) || 0,
            kumulativ_otkazanih_iznosa: parseFloat(rowData.kumulativ_otkazanih_iznosa) || 0,
            iznos_za_prenos_sredstava: parseFloat(rowData.iznos_za_prenos_sredstava) || 0,
            serviceId: service.id,
            provajderId: providerId,
          },
          update: {
            jedinicna_cena: parseFloat(rowData.jedinicna_cena) || 0,
            broj_transakcija: parseInt(rowData.broj_transakcija) || 0,
            fakturisan_iznos: parseFloat(rowData.fakturisan_iznos) || 0,
            fakturisan_korigovan_iznos: parseFloat(rowData.fakturisan_korigovan_iznos) || 0,
            naplacen_iznos: parseFloat(rowData.naplacen_iznos) || 0,
            kumulativ_naplacenih_iznosa: parseFloat(rowData.kumulativ_naplacenih_iznosa) || 0,
            nenaplacen_iznos: parseFloat(rowData.nenaplacen_iznos) || 0,
            nenaplacen_korigovan_iznos: parseFloat(rowData.nenaplacen_korigovan_iznos) || 0,
            storniran_iznos: parseFloat(rowData.storniran_iznos) || 0,
            otkazan_iznos: parseFloat(rowData.otkazan_iznos) || 0,
            kumulativ_otkazanih_iznosa: parseFloat(rowData.kumulativ_otkazanih_iznosa) || 0,
            iznos_za_prenos_sredstava: parseFloat(rowData.iznos_za_prenos_sredstava) || 0,
          }
        });

        imported++;
      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error processing row: ${errorMsg}`);
        console.error('Error processing row:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${imported} records imported, ${failed} failed`,
      imported,
      failed,
      errors: errors.length > 0 ? errors.slice(0, 20) : undefined, // Show first 20 errors
    });
  } catch (error) {
    console.error('Error importing VAS data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}