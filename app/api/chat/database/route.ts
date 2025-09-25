// app/api/chat/database/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();

// Konfiguracija za OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Database schema informacije za AI
const DATABASE_SCHEMA = `
Database Schema Information:

Tables and their relationships:
1. User (korisnici sistema) - id, name, email, role (ADMIN, MANAGER, AGENT, USER)
2. Provider (provajderi usluga) - id, name, contactName, email, phone, isActive
3. HumanitarianOrg (humanitarne organizacije) - id, name, contactName, email, phone, pib, registrationNumber
4. ParkingService (parking servisi) - id, name, contactName, email, phone, isActive
5. Contract (ugovori) - id, name, contractNumber, type (PROVIDER, HUMANITARIAN, PARKING, BULK), status (ACTIVE, EXPIRED, PENDING, TERMINATED), startDate, endDate, revenuePercentage
6. Service (servisi) - id, name, type (VAS, BULK, HUMANITARIAN, PARKING), description, isActive, billingType (PREPAID, POSTPAID)
7. VasService (VAS transakcije) - proizvod, mesec_pruzanja_usluge, jedinicna_cena, broj_transakcija, fakturisan_iznos
8. BulkService (bulk transakcije) - provider_name, service_name, sender_name, requests, message_parts, datumNaplate
9. ParkingTransaction (parking transakcije) - date, serviceName, price, quantity, amount
10. VasTransaction (VAS transakcije nova tabla) - date, serviceName, serviceCode, price, quantity, amount, group (prepaid/postpaid)
11. Complaint (žalbe) - id, title, description, status (NEW, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED), priority, submittedBy, assignedAgent
12. Product (proizvodi) - id, name, code, description, isActive
13. LogEntry (log zapisi) - entityType, action, subject, description, status, providerId, parkingServiceId
14. Notification (notifikacije) - title, message, type, isRead, userId
15. ContractRenewal (renewal procesi) - contractId, subStatus, proposedStartDate, proposedEndDate
16. SenderBlacklist (blacklista pošaljilaca) - senderName, effectiveDate, isActive

Important relationships:
- Contract belongs to Provider, HumanitarianOrg, or ParkingService
- Services are linked to Contracts through ServiceContract
- Complaints can be related to Services, Products, Providers
- VasService/BulkService belong to Provider and Service
- Users have roles and can create/modify various entities

Common queries:
- Active/inactive entities: use isActive field
- Financial data: VasService, BulkService, ParkingTransaction tables
- Date ranges: use createdAt, startDate, endDate, mesec_pruzanja_usluge
- Status filtering: Contract.status, Complaint.status
`;

// Funkcija za generisanje SQL upita iz prirodnog jezika
async function generateSQLQuery(userMessage: string, conversationHistory: any[]) {
  const systemPrompt = `You are a helpful database assistant that converts natural language questions to SQL queries for a PostgreSQL database.

${DATABASE_SCHEMA}

CRITICAL RULES:
1. Return ONLY the SQL query - NO explanations, NO markdown, NO code blocks
2. Do NOT use markdown formatting 
3. Always use proper PostgreSQL syntax with double quotes for table/column names
4. Use table aliases for readability (e.g., c for Contract, p for Provider)
5. Always include LIMIT clauses to prevent large result sets (usually LIMIT 10-50)
6. Use proper JOIN syntax when relating tables
7. Format dates using PostgreSQL date functions
8. Use Serbian language in column names as they appear in schema
9. For counts and aggregations, use proper GROUP BY
10. Always handle null values appropriately
11. Use proper WHERE clauses for filtering
12. NEVER use columns that don't exist like shortNumber, shortCode, etc.
13. Only use the exact column names provided in the schema

EXAMPLES OF CORRECT OUTPUT:
SELECT COUNT(*) as ukupno_aktivnih FROM "Contract" WHERE status = 'ACTIVE';

SELECT p.name, COUNT(c.id) as broj_zalbi FROM "Provider" p LEFT JOIN "Complaint" c ON p.id = c."providerId" GROUP BY p.id, p.name ORDER BY broj_zalbi DESC LIMIT 10;

SELECT name, "contractNumber", "endDate" FROM "Contract" WHERE "endDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' AND status = 'ACTIVE' ORDER BY "endDate" LIMIT 20;

SELECT h.name, h."shortNumber" FROM "HumanitarianOrg" h WHERE h."isActive" = true LIMIT 20;

WRONG EXAMPLES - NEVER DO THIS:
SELECT c.shortNumber FROM "Contract" c; -- shortNumber does not exist in Contract table
SELECT p.contractCode FROM "Provider" p; -- contractCode does not exist anywhere

User question: "${userMessage}"

SQL query (no formatting, just the query):`;

  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3.1:free", // ili neki drugi besplatan model
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(-3).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: "user", content: userMessage }
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    return completion.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error('Error generating SQL:', error);
    throw new Error('Failed to generate SQL query');
  }
}

// Funkcija za izvršavanje SQL upita
async function executeSQLQuery(sqlQuery: string) {
  try {
    // Uklanjanje potencijalnih opasnih komandi
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE'];
    const upperQuery = sqlQuery.toUpperCase();
    
    if (dangerousKeywords.some(keyword => upperQuery.includes(keyword))) {
      throw new Error('Ovaj upit nije dozvoljen iz bezbednosnih razloga');
    }

    // Provera za zabranjene kolone
    const forbiddenColumns = ['shortNumber', 'shortCode', 'contractCode'];
    const queryLower = sqlQuery.toLowerCase();
    
    for (const forbidden of forbiddenColumns) {
      if (queryLower.includes(forbidden.toLowerCase()) && !queryLower.includes('humanitarianorg')) {
        throw new Error(`Kolona '${forbidden}' ne postoji u ovoj tabeli. Proverite dostupne kolone.`);
      }
    }

    console.log('Executing SQL query:', sqlQuery);

    // Izvršavanje upita kroz Prisma raw query
    const result = await prisma.$queryRawUnsafe(sqlQuery);
    return result;
  } catch (error) {
    console.error('SQL execution error:', error);
    console.error('Failed query:', sqlQuery);
    throw new Error(`Greška u izvršavanju upita: ${error.message}`);
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
      model: "google/gemma-2-9b-it:free", // Koristi jedan od pouzdanih besplatnih modela
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
      return `Pronašao sam ${queryResult.length} rezultat(a). Evo prvих nekoliko:\n\n${JSON.stringify(queryResult.slice(0, 5), null, 2)}`;
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

    // 1. Generiši SQL upit
    const sqlQuery = await generateSQLQuery(message, history);
    
    if (!sqlQuery) {
      return NextResponse.json(
        { error: 'Nije moguće generisati SQL upit' },
        { status: 400 }
      );
    }

    // 2. Izvršava SQL upit
    const queryResult = await executeSQLQuery(sqlQuery);

    // 3. Formatira odgovor
    const formattedResponse = await formatResponse(message, queryResult as any[], sqlQuery);

    return NextResponse.json({
      response: formattedResponse,
      sqlQuery: sqlQuery.length < 500 ? sqlQuery : sqlQuery.substring(0, 500) + '...',
      resultCount: Array.isArray(queryResult) ? queryResult.length : 0
    });

  } catch (error) {
    console.error('Database chat error:', error);
    
    return NextResponse.json(
      { 
        error: 'Došlo je do greške prilikom obrade zahteva',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Opciono: GET endpoint za health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Database chat API is running' 
  });
}