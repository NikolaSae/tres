// app/api/providers/vas-import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const providerId = formData.get('providerId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
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
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No data found in Excel file' },
        { status: 400 }
      );
    }

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each row
    for (const row of data) {
      try {
        const rowData = row as any;

        // Validate required fields
        if (!rowData.proizvod || !rowData.mesec_pruzanja_usluge) {
          failed++;
          errors.push(`Missing required fields in row: ${JSON.stringify(rowData)}`);
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

        // Parse date
        const serviceDate = new Date(rowData.mesec_pruzanja_usluge);

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
        errors.push(`Error processing row: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('[VAS_IMPORT_ROW_ERROR]', error);
      }
    }

    // ✅ Invaliduj cache posle import
    revalidatePath('/providers');
    revalidatePath(`/providers/${providerId}`);
    revalidatePath('/services');

    return NextResponse.json({
      success: true,
      message: `Import completed: ${imported} records imported, ${failed} failed`,
      imported,
      failed,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Return first 10 errors
    });
  } catch (error) {
    console.error('[VAS_IMPORT_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}