// /app/api/services/import/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { importServices } from '@/actions/services/import';
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const role = await currentRole();
  if (role !== UserRole.ADMIN && role !== UserRole.MANAGER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const csvContent = await request.text();
    if (!csvContent) {
      return NextResponse.json({ error: "No CSV content provided." }, { status: 400 });
    }

    const result = await importServices(csvContent);

    const status = result.importErrors.length > 0 ? 400 : 200;

    return NextResponse.json(
      {
        success:
          result.error === null
            ? `Import completed. ${result.validRows.length} processed, ${result.invalidRows.length} failed.`
            : undefined,
        error: result.error,
        validCount: result.validRows.length,
        invalidCount: result.invalidRows.length,
        invalidRows: result.invalidRows,
        importErrors: result.importErrors,
        // ✅ Ako importServices vraća createdCount, dodaj ga u tip umesto cast-a
        createdCount: (result as { createdCount?: number }).createdCount,
      },
      { status }
    );
  } catch (error) {
    console.error("Error during service import:", error);
    return NextResponse.json({ error: "Failed to process service import." }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}