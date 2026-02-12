// app/api/chat/database-simple/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ ISPRAVKA: Dodat type za predefined queries
type QueryKey = keyof typeof PREDEFINED_QUERIES;

const PREDEFINED_QUERIES = {
  aktivni_ugovori: {
    sql: 'SELECT COUNT(*) as count FROM "Contract" WHERE status = \'ACTIVE\'',
    description: 'Broj aktivnih ugovora'
  },
  provajderi_zalbe: {
    sql: 'SELECT p.name, COUNT(c.id) as complaint_count FROM "Provider" p LEFT JOIN "Complaint" c ON p.id = c."providerId" GROUP BY p.id, p.name ORDER BY complaint_count DESC LIMIT 10',
    description: 'Provajderi sa najviše žalbi'
  },
  ugovori_isticanje: {
    sql: 'SELECT name, "contractNumber", "endDate" FROM "Contract" WHERE status = \'ACTIVE\' AND "endDate" > NOW() AND "endDate" < NOW() + INTERVAL \'60 days\' ORDER BY "endDate" ASC',
    description: 'Ugovori koji ističu uskoro'
  },
  vas_prihod: {
    sql: 'SELECT SUM("fakturisan_iznos") as total FROM "VasService"',
    description: 'Ukupan prihod iz VAS servisa'
  },
  humanitarne_neaktivne: {
    sql: 'SELECT name, email FROM "HumanitarianOrg" WHERE "isActive" = false',
    description: 'Neaktivne humanitarne organizacije'
  },
  zalbe_nove: {
    sql: 'SELECT COUNT(*) as count FROM "Complaint" WHERE status IN (\'NEW\', \'PENDING\')',
    description: 'Broj novih žalbi'
  },
  ukupno_provajdera: {
    sql: 'SELECT COUNT(*) as count FROM "Provider" WHERE "isActive" = true',
    description: 'Ukupan broj aktivnih provajdera'
  },
  parking_servisi: {
    sql: 'SELECT name, address FROM "ParkingService" LIMIT 10',
    description: 'Lista parking servisa'
  }
} as const;

// Helper funkcija za formatiranje rezultata
function formatResults(results: any[], queryType: string): string {
  if (!Array.isArray(results) || results.length === 0) {
    return "Nema podataka za prikaz.";
  }

  const queryInfo = PREDEFINED_QUERIES[queryType as QueryKey];
  
  if (results.length === 1 && 'count' in results[0]) {
    return `${queryInfo.description}: ${results[0].count}`;
  }

  if (results.length === 1 && 'total' in results[0]) {
    return `${queryInfo.description}: ${Number(results[0].total).toFixed(2)} RSD`;
  }

  let response = `${queryInfo.description}:\n\n`;
  results.forEach((row, index) => {
    const entries = Object.entries(row);
    response += `${index + 1}. ${entries.map(([key, value]) => `${key}: ${value}`).join(', ')}\n`;
  });

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

    // Pronalaženje najboljeg match-a na osnovu ključnih reči
    const lowerMessage = message.toLowerCase();
    let intent: string | null = null;

    // Mapiranje ključnih reči na query tipove
    const keywords: Record = {
      aktivni_ugovori: ['aktivni ugovori', 'active contracts', 'koliko aktivnih', 'broj ugovora'],
      provajderi_zalbe: ['provajderi žalbe', 'providers complaints', 'žalbe provajdera'],
      ugovori_isticanje: ['ugovori isticanje', 'contracts expiring', 'istječu ugovori'],
      vas_prihod: ['vas prihod', 'vas revenue', 'vas servis prihod', 'ukupan prihod vas'],
      humanitarne_neaktivne: ['neaktivne humanitarne', 'inactive humanitarian'],
      zalbe_nove: ['nove žalbe', 'new complaints', 'pending žalbe'],
      ukupno_provajdera: ['broj provajdera', 'total providers', 'koliko provajdera'],
      parking_servisi: ['parking servisi', 'parking services', 'lista parking']
    };

    for (const [queryType, terms] of Object.entries(keywords)) {
      if (terms.some(term => lowerMessage.includes(term))) {
        intent = queryType;
        break;
      }
    }

    if (!intent) {
      const availableQueries = Object.entries(PREDEFINED_QUERIES)
        .map(([key, value]) => value.description)
        .join('\n• ');

      return NextResponse.json({
        response: `Nisam pronašao odgovarajući upit za vašu poruku. 
        
Evo šta mogu da vam pokažem:\n\n• ${availableQueries}\n\nPokušajte da preformulišete pitanje koristeći ove ključne reči.`,
        sqlQuery: null,
        resultCount: 0
      });
    }

    // ✅ ISPRAVKA: Type assertion za pristup objektu
    const queryInfo = PREDEFINED_QUERIES[intent as QueryKey];
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
    
    // ✅ ISPRAVKA: Proper error type handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Došlo je do greške prilikom pretrage baze podataka',
        details: errorMessage
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