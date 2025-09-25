// app/api/providers/by-name/[name]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const providerName = decodeURIComponent(params.name);
    
    console.log('Looking up provider by name:', providerName);

    // Map file names to database names
    const providerMapping: Record<string, string> = {
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

    // Try to find provider by mapped name first, then by original name
    const mappedName = providerMapping[providerName] || providerName;
    
    const provider = await db.provider.findFirst({
      where: {
        OR: [
          { name: mappedName },
          { name: providerName },
          { name: { contains: providerName, mode: 'insensitive' } },
          { name: { contains: mappedName, mode: 'insensitive' } }
        ]
      }
    });

    if (!provider) {
      console.log('Provider not found:', providerName, 'mapped to:', mappedName);
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    console.log('Found provider:', provider);
    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error finding provider:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}