// app/api/chat/database-simple/route.ts
// Jednostavan pristup bez AI-ja - koristi predefinisane upite

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Predefinisani upiti za najčešće potrebe
const PREDEFINED_QUERIES = {
  'aktivni_ugovori': {
    sql: 'SELECT COUNT(*) as ukupno FROM "Contract" WHERE status = \'ACTIVE\'',
    description: 'Broj aktivnih ugovora'
  },
  'provajderi_zalbe': {
    sql: `SELECT p.name, COUNT(c.id) as broj_zalbi 
          FROM "Provider" p 
          LEFT JOIN "Complaint" c ON p.id = c."providerId" 
          GROUP BY p.id, p.name 
          ORDER BY broj_zalbi DESC 
          LIMIT 10`,
    description: 'Provajderi sa najviše žalbi'
  },
  'ugovori_isticanje': {
    sql: `SELECT name, "contractNumber", "endDate" 
          FROM "Contract" 
          WHERE "endDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' 
          AND status = 'ACTIVE' 
          ORDER BY "endDate" 
          LIMIT 20`,
    description: 'Ugovori koji ističu u narednih 30 dana'
  },
  'vas_prihod': {
    sql: `SELECT SUM("fakturisan_iznos") as ukupno_fakturisano
          FROM "VasService" 
          WHERE "mesec_pruzanja_usluge" >= date_trunc('month', CURRENT_DATE)`,
    description: 'VAS prihod u trenutnom mesecu'
  },
  'humanitarne_neaktivne': {
    sql: `SELECT name, email, phone 
          FROM "HumanitarianOrg" 
          WHERE "isActive" = false 
          LIMIT 10`,
    description: 'Neaktivne humanitarne organizacije'
  },
  'zalbe_nove': {
    sql: `SELECT title, description, "createdAt" 
          FROM "Complaint" 
          WHERE status = 'NEW' 
          ORDER BY "createdAt" DESC 
          LIMIT 10`,
    description: 'Nove žalbe'
  },
  'ukupno_provajdera': {
    sql: 'SELECT COUNT(*) as ukupno FROM "Provider" WHERE "isActive" = true',
    description: 'Broj aktivnih provajdera'
  },
  'parking_servisi': {
    sql: `SELECT name, "contactName", email 
          FROM "ParkingService" 
          WHERE "isActive" = true 
          LIMIT 10`,
    description: 'Aktivni parking servisi'
  }
};

// Funkcija za prepoznavanje namere korisnika
function detectUserIntent(message: string): string | null {
  const msg = message.toLowerCase();
  
  if (msg.includes('aktivn') && msg.includes('ugovor')) return 'aktivni_ugovori';
  if (msg.includes('provajder') && msg.includes('žalb')) return 'provajderi_zalbe';
  if (msg.includes('ugovor') && (msg.includes('istič') || msg.includes('uskoro'))) return 'ugovori_isticanje';
  if (msg.includes('vas') && (msg.includes('prihod') || msg.includes('iznos'))) return 'vas_prihod';
  if (msg.includes('humanitarn') && msg.includes('neaktivn')) return 'humanitarne_neaktivne';
  if (msg.includes('žalb') && (msg.includes('nov') || msg.includes('new'))) return 'zalbe_nove';
  if (msg.includes('provajder') && (msg.includes('ukupno') || msg.includes('broj'))) return 'ukupno_provajdera';
  if (msg.includes('parking')) return 'parking_servisi';
  
  return null;
}

// Funkcija za formatiranje rezultata
function formatResults(data: any[], queryKey: string): string {
  if (!Array.isArray(data) || data.length === 0) {
    return "Nema rezultata za ovaj upit.";
  }

  const queryInfo = PREDEFINED_QUERIES[queryKey];
  let response = `${queryInfo.description}:\n\n`;

  if (data.length === 1 && typeof data[0] === 'object') {
    const result = data[0];
    if (Object.keys(result).length === 1) {
      const value = Object.values(result)[0];
      return `${queryInfo.description}: ${value}`;
    }
  }

  // Formatiranje tabele
  data.slice(0, 10).forEach((row, index) => {
    response += `${index + 1}. `;
    const entries = Object.entries(row);
    entries.forEach(([key, value], i) => {
      if (i > 0) response += ', ';
      
      // Formatiranje datuma
      if (value instanceof Date) {
        response += `${key}: ${value.toLocaleDateString('sr-RS')}`;
      } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        response += `${key}: ${new Date(value).toLocaleDateString('sr-RS')}`;
      } else {
        response += `${key}: ${value}`;
      }
    });
    response += '\n';
  });

  if (data.length > 10) {
    response += `\n... i još ${data.length - 10} rezultata.`;
  }

  return response;
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Poruka je obavezna' },
        { status: 400 }
      );
    }

    // Detektuj nameru korisnika
    const intent = detectUserIntent(message);
    
    if (!intent) {
      const availableQueries = Object.values(PREDEFINED_QUERIES).map(q => q.description).join('\n• ');
      
      return NextResponse.json({
        response: `Izvinjavam se, nisam razumeo vaš upit. Evo šta mogu da vam pokažem:\n\n• ${availableQueries}\n\nPokušajte da preformulišete pitanje koristeći ove ključne reči.`,
        sqlQuery: null,
        resultCount: 0
      });
    }

    // Izvršava predefinisani SQL upit
    const queryInfo = PREDEFINED_QUERIES[intent];
    console.log('Executing query:', queryInfo.sql);
    
    const result = await prisma.$queryRawUnsafe(queryInfo.sql);
    console.log('Query result:', result);

    // Formatira odgovor
    const formattedResponse = formatResults(result as any[], intent);

    return NextResponse.json({
      response: formattedResponse,
      sqlQuery: queryInfo.sql,
      resultCount: Array.isArray(result) ? result.length : 0
    });

  } catch (error) {
    console.error('Database query error:', error);
    
    return NextResponse.json(
      { 
        error: 'Došlo je do greške prilikom pretrage baze podataka',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    availableQueries: Object.keys(PREDEFINED_QUERIES),
    message: 'Simple database chat API is running' 
  });
}