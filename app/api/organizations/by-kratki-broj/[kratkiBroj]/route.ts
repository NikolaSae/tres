// app/api/organizations/by-kratki-broj/[kratkiBroj]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db'; // adjust import path as needed

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kratkiBroj: string }> }
) {
  try {
    // Await params before using its properties (Next.js 15 requirement)
    const { kratkiBroj } = await params;

    const organization = await db.humanitarianOrg.findFirst({
      where: {
        shortNumber: kratkiBroj // This maps to the kratki_broj column in the database
      }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}