// app/api/providers/by-name/[name]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// ✅ Provider name mapping
const PROVIDER_NAME_MAPPING: Record<string, string> = {
  'Akton': 'Akton',
  'ComTradeITSS': 'ComTradeITSS', 
  'BusLogic': 'BusLogic',
  'CePP': 'CePP',
  'ussdpromo': 'EKG',
  'Halcom': 'Halcom',
  'Infobip': 'Infobip',
  'mKonekt': 'mKonekt',
  'mond': 'Mond',
  'NTHDCB': 'NTHDCB',
  'nthmedia': 'NTHMedia',
  'Nuewoo': 'Nuewoo',
  'fonlider': 'OneClickSolutions',
  'Pink': 'Pink',
  // Parking providers
  'PSNoviSad': 'Parking Servis Novi Sad',
  'PSC': 'Parking Servis Centralni',
  'SynapseTech': 'SynapseTech',
  'easy_park': 'Easy Park',
  'DjokovicSoftver': 'Djokovic Softver',
  'StoreFront': 'StoreFront',
  'Key4S': 'Key4S',
  'mTicketing': 'mTicketing',
  'ParkingBeograd': 'Parking Beograd',
  'ParkingServisNis': 'Parking Servis Niš'
};

// ✅ Cached funkcija za provider lookup
const getCachedProviderByName = unstable_cache(
  async (providerName: string, mappedName: string) => {
    console.log(`🔍 Looking up provider: ${providerName} (mapped: ${mappedName})`);
    
    return db.provider.findFirst({
      where: {
        OR: [
          { name: mappedName },
          { name: providerName },
          { name: { contains: providerName, mode: 'insensitive' } },
          { name: { contains: mappedName, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        imageUrl: true,
      }
    });
  },
  ['provider-by-name'],
  { revalidate: 300 } // 5 minuta cache
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    // ✅ Auth check
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const awaitedParams = await params;
    const providerName = decodeURIComponent(awaitedParams.name);

    if (!providerName || providerName.trim() === '') {
      return NextResponse.json(
        { error: 'Provider name is required' },
        { status: 400 }
      );
    }

    // ✅ Map provider name
    const mappedName = PROVIDER_NAME_MAPPING[providerName] || providerName;
    
    // ✅ Fetch cached provider
    const provider = await getCachedProviderByName(providerName, mappedName);

    if (!provider) {
      console.log(`❌ Provider not found: ${providerName} (mapped: ${mappedName})`);
      return NextResponse.json(
        { 
          error: 'Provider not found',
          searchedNames: [providerName, mappedName]
        },
        { status: 404 }
      );
    }

    console.log(`✅ Found provider: ${provider.name} (ID: ${provider.id})`);
    
    return NextResponse.json({
      success: true,
      provider
    });

  } catch (error) {
    console.error('[PROVIDER_BY_NAME_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}