// app/api/chat/database/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || '',
    'X-Title': 'Contract Management Chat'
  }
});

// Funkcija za izvršavanje SQL upita
async function executeSqlQuery(sqlQuery: string) {
  try {
    // Provera da li upit počinje sa SELECT
    if (!sqlQuery.trim().toUpperCase().startsWith('SELECT')) {
      throw new Error('Samo SELECT upiti su dozvoljeni iz bezbednosnih razloga.');
    }

    // Provera da li upit sadrži opasne komande
    const dangerousKeywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'TRUNCATE', 'ALTER', 'CREATE'];
    const upperQuery = sqlQuery.toUpperCase();
    
    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        throw new Error(`Upit sadrži zabranjenu komandu: ${keyword}. Samo READ operacije su dozvoljene.`);
      }
    }

    console.log('Executing SQL query:', sqlQuery);

    // Izvršavanje upita kroz Prisma raw query
    const result = await prisma.$queryRawUnsafe(sqlQuery);
    return result;
  } catch (error) {
    console.error('SQL execution error:', error);
    console.error('Failed query:', sqlQuery);
    // ✅ ISPRAVKA: Proper error type handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Greška u izvršavanju upita: ${errorMessage}`);
  }
}

// Funkcija za formatiranje rezultata u prirodni odgovor
async function formatResponse(userMessage: string, queryResult: any[], sqlQuery: string) {
  const resultText = Array.isArray(queryResult) && queryResult.length > 0 
    ? JSON.stringify(queryResult, null, 2)
    : "Nema rezultata za ovaj upit.";

  const formatPrompt = `You are a helpful assistant that formats database query results into natural, conversational Serbian responses.

User asked: "${userMessage}"
SQL query executed: "${sqlQuery}"
Raw results: ${resultText.substring(0, 2000)} ${resultText.length > 2000 ? '...(truncated)' : ''}

Rules:
1. Respond in Serbian language
2. Make the response conversational and easy to understand
3. If there are no results, explain it naturally
4. For numerical data, include totals and summaries
5. Format dates in Serbian format (DD.MM.YYYY)
6. Don't show raw JSON, format it nicely
7. If there are many results, mention the total count and show key highlights
8. Be concise but informative

Format the results into a natural Serbian response:`;

  try {
    const completion = await openai.chat.completions.create({
      model: "google/gemma-2-9b-it:free",
      messages: [
        { role: "system", content: formatPrompt },
        { role: "user", content: "Format this response" }
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    return completion.choices[0]?.message?.content?.trim() || "Izvinjavam se, došlo je do greške prilikom formatiranja odgovora.";
  } catch (error) {
    console.error('Error formatting response:', error);
    
    // Fallback formatting
    if (Array.isArray(queryResult) && queryResult.length > 0) {
      if (queryResult.length === 1 && typeof queryResult[0] === 'object') {
        const obj = queryResult[0];
        const keys = Object.keys(obj);
        if (keys.length === 1 && typeof obj[keys[0]] === 'number') {
          return `Rezultat: ${obj[keys[0]]}`;
        }
      }
      return `Pronašao sam ${queryResult.length} rezultat(a). Evo prvih nekoliko:\n\n${JSON.stringify(queryResult.slice(0, 5), null, 2)}`;
    } else {
      return "Nema rezultata za ovaj upit.";
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Poruka je obavezna' },
        { status: 400 }
      );
    }

    // Kreiraj prompt za AI da generiše SQL
    const systemPrompt = `Ti si AI asistent koji pomaže korisnicima da pretražuju bazu podatakaContract Management sistema.

Dostupne tabele i njihove glavne kolone:
- Contract: id, name, contractNumber, type, status, startDate, endDate, providerId, humanitarianOrgId, parkingServiceId
- Provider: id, name, contactName, email, phone, type, isActive
- HumanitarianOrg: id, name, shortNumber, contactPerson, email, phone, isActive
- ParkingService: id, name, address, contactName, email, phone
- Service: id, name, type, description, isActive
- Complaint: id, title, description, status, priority, serviceId, providerId, submittedById
- User: id, name, email, role

Tvoj zadatak je da na osnovu korisnikovog pitanja generišeš SAMO JEDAN validan PostgreSQL SELECT upit.
VAŽNO: Nemoj dodavati nikakva objašnjenja, markdown formatiranje ili dodatni tekst - samo čist SQL upit.

Pravila:
1. Koristi SAMO SELECT upite
2. Koristi pravilne nazive tabela i kolona
3. Koristi JOIN gde je potrebno
4. Koristi LIMIT za ograničavanje rezultata ako nije specificirano drugačije
5. Formatiranje datuma: koristi PostgreSQL DATE funkcije
6. Za pretragu teksta koristi ILIKE za case-insensitive pretragu`;

    const conversationHistory = history.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Pozovi AI da generiše SQL
    const completion = await openai.chat.completions.create({
      model: 'google/gemma-2-9b-it:free',
      messages: aiMessages as any,
      max_tokens: 500,
      temperature: 0.1,
    });

    let sqlQuery = completion.choices[0]?.message?.content?.trim() || '';

    // Očisti SQL upit od markdown formatiranja
    sqlQuery = sqlQuery.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('Generated SQL query:', sqlQuery);

    if (!sqlQuery) {
      return NextResponse.json({
        response: 'Nisam uspeo da generišem SQL upit na osnovu vašeg pitanja. Možete li biti precizniji?',
        sqlQuery: null,
        resultCount: 0
      });
    }

    // Izvršavanje SQL upita
    const queryResult = await executeSqlQuery(sqlQuery);

    // Formatiranje odgovora
    const formattedResponse = await formatResponse(message, queryResult as any[], sqlQuery);

    return NextResponse.json({
      response: formattedResponse,
      sqlQuery: sqlQuery,
      resultCount: Array.isArray(queryResult) ? queryResult.length : 0
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
    message: 'Database chat API is running' 
  });
}