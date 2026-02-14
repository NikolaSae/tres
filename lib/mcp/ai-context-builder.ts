// lib/mcp/ai-context-builder.ts

import type { McpTool, McpContext } from './types';

// ✅ Dodaj tip za role
type UserRole = 'ADMIN' | 'MANAGER' | 'AGENT' | 'USER';

// ✅ Dodaj interfejs za role description
interface RoleDescription {
  title: string;
  capabilities: string[];
  focus: string;
}

/**
 * Generiše optimizovan kontekst za AI asistenta
 * Fokus: Natural language, use-cases, relacije između podataka
 */
export class AIContextBuilder {
  
  /**
   * Kreira kompletan sistem prompt za AI
   */
  static buildSystemPrompt(tools: McpTool[], userRole: string, context: McpContext): string {
    const sections = [
      this.buildRoleContext(userRole),
      this.buildToolsOverview(tools),
      this.buildUseCaseGuide(),
      this.buildDataRelationships(),
      this.buildResponseGuidelines(),
      this.buildExamples()
    ];

    return sections.join('\n\n');
  }

  /**
   * 1. ROLE KONTEKST - Ko je korisnik i šta može
   */
  private static buildRoleContext(role: string): string {
    // ✅ Dodaj tipizaciju za roleDescriptions
    const roleDescriptions: Record<UserRole, RoleDescription> = {
      ADMIN: {
        title: 'Administrator',
        capabilities: [
          'Kompletan pristup svim podacima i operacijama',
          'Može kreirati i menjati provajdere, humanitarne organizacije',
          'Pristup sistemskim metrikama i zdravlju sistema',
          'Bulk operacije nad ugovorima i žalbama'
        ],
        focus: 'Strateški pregled i sistemska administracija'
      },
      MANAGER: {
        title: 'Menadžer',
        capabilities: [
          'Pristup svim ugovorima, žalbama i provajderima',
          'Može kreirati i ažurirati ugovore',
          'Finansijski izveštaji i analitika',
          'Pretraga svih entiteta'
        ],
        focus: 'Biznis analitika i odlučivanje'
      },
      AGENT: {
        title: 'Agent',
        capabilities: [
          'Pristup žalbama dodeljenim njemu',
          'Kreiranje i ažuriranje žalbi',
          'Pregled ugovora i provajdera',
          'Komentarisanje i rešavanje žalbi'
        ],
        focus: 'Rad sa klijentima i rešavanje problema'
      },
      USER: {
        title: 'Korisnik',
        capabilities: [
          'Pregled vlastitih ugovora',
          'Kreiranje žalbi',
          'Praćenje sopstvenih aktivnosti'
        ],
        focus: 'Lični pregled i osnovne operacije'
      }
    };

    // ✅ Type guard za role
    const isValidRole = (r: string): r is UserRole => {
      return ['ADMIN', 'MANAGER', 'AGENT', 'USER'].includes(r);
    };

    const desc = isValidRole(role) ? roleDescriptions[role] : roleDescriptions.USER;

    return `# ULOGA KORISNIKA: ${desc.title}

**Mogućnosti:**
${desc.capabilities.map((c: string) => `- ${c}`).join('\n')}

**Fokus asistiranja:** ${desc.focus}`;
  }

  /**
   * 2. TOOLS OVERVIEW - Organizovano po kategorijama
   */
  private static buildToolsOverview(tools: McpTool[]): string {
    const categories = {
      read: '📖 ČITANJE PODATAKA',
      write: '✏️ IZMENA PODATAKA',
      analytics: '📊 ANALITIKA I STATISTIKE',
      system: '⚙️ SISTEMSKE OPERACIJE'
    };

    let overview = '# DOSTUPNI ALATI\n\n';

    for (const [category, title] of Object.entries(categories)) {
      const categoryTools = tools.filter(t => t.category === category);
      if (categoryTools.length === 0) continue;

      overview += `## ${title}\n\n`;
      
      for (const tool of categoryTools) {
        overview += `### ${tool.name}\n`;
        overview += `${tool.description}\n\n`;
        
        if (tool.examples && tool.examples.length > 0) {
          overview += `**Primeri korišćenja:**\n`;
          tool.examples.forEach(ex => {
            overview += `- "${ex}"\n`;
          });
          overview += '\n';
        }

        // Dodaj input parametre ako su relevantni
        overview += this.formatInputSchema(tool.inputSchema);
        overview += '\n';
      }
    }

    return overview;
  }

  /**
   * 3. USE CASE GUIDE - Kada koristiti koji alat
   */
  private static buildUseCaseGuide(): string {
    return `# VODIČ ZA UPOTREBU

## Kada koristiti koji alat?

### 📋 Pregled i izvještavanje
- **"Prikaži ugovore"** → \`get_contracts\`
- **"Aktivni provajderi"** → \`get_providers\` (isActive: true)
- **"Nove žalbe"** → \`get_complaints\` (status: NEW)
- **"Pretraži Telekom"** → \`search_entities\` (query: "Telekom")

### 📊 Statistike i analize
- **"Moja aktivnost"** → \`get_user_stats\`
- **"Šta se desilo danas"** → \`get_activity_overview\` (period: today)
- **"Finansijski izveštaj"** → \`get_financial_summary\`

### ✏️ Kreiranje i izmene
- **"Kreiraj žalbu"** → \`create_complaint\`
- **"Ažuriraj status"** → \`update_complaint\` ili \`update_contract\`
- **"Dodaj komentar"** → \`add_complaint_comment\`

### 🔗 Kombinovanje alata
Često je potrebno kombinovati više alata za kompletan odgovor:

**Primer: "Prikaži sve aktivne ugovore sa Telekomom i sve žalbe na njih"**
1. \`search_entities\` (query: "Telekom") → dobij providerId
2. \`get_contracts\` (providerId: ID, status: ACTIVE)
3. \`get_complaints\` (providerId: ID)

**Primer: "Ko je najaktivniji agent ovog meseca?"**
1. \`get_activity_overview\` (period: month)
2. \`get_complaints\` (groupBy: assignedAgentId)
3. Analiziraj i rangiraj rezultate`;
  }

  /**
   * 4. DATA RELATIONSHIPS - Kako se podaci povezuju
   */
  private static buildDataRelationships(): string {
    return `# RELACIJE PODATAKA

## Struktura baze podataka

\`\`\`
📄 Contract (Ugovor)
├── 🏢 Provider (Provajder) - ko pruža uslugu
├── 🤝 HumanitarianOrg (Humanitarna org.) - opciono
├── 🅿️ ParkingService - opciono
├── 👤 CreatedBy (User) - ko je kreirao
├── 📦 Services[] - VAS usluge
├── 📎 Attachments[] - dokumenti
└── 🔄 Renewals[] - obnavljanja

😠 Complaint (Žalba)
├── 👤 SubmittedBy (User) - ko je prijavio
├── 👨‍💼 AssignedAgent (User) - zadužen agent
├── 🏢 Provider - na kog provajdera
├── 📦 Service - na koju uslugu
└── 💬 Comments[] - komentari

🏢 Provider (Provajder)
├── 📄 Contracts[] - njihovi ugovori
├── 😠 Complaints[] - žalbe na njih
└── 📦 VasServices[] - usluge koje nude
\`\`\`

## Ključni odnosi

1. **Provider → Contracts** (1:N)
   - Jedan provajder može imati više ugovora
   - Ugovor pripada jednom provajderu

2. **Contract → Services** (1:N)
   - Ugovor može imati više VAS usluga
   - Svaka usluga pripada jednom ugovoru

3. **Complaint → Provider + Service** (N:1)
   - Žalba se odnosi na jednog provajdera
   - I opciono na jednu specifičnu uslugu

4. **User → Multiple roles**
   - Može biti creator ugovora
   - Može biti submitter žalbe
   - Može biti assigned agent za žalbu`;
  }

  /**
   * 5. RESPONSE GUIDELINES - Kako formatirati odgovore
   */
  private static buildResponseGuidelines(): string {
    return `# SMERNICE ZA ODGOVORE

## Struktura odgovora

UVEK vraćaj strukturiran JSON:
\`\`\`json
{
  "success": true,
  "message": "Ljudski čitljiva poruka",
  "data": {
    // Relevantni podaci
  },
  "summary": {
    // Sažetak brojeva
  }
}
\`\`\`

## Stilski smernice

### ✅ DOBRO
- **Prirodan jezik:** "Pronađeno je 5 aktivnih ugovora sa Telekomom"
- **Kontekst:** "Od toga, 2 ističu u narednih 30 dana"
- **Akcioni predlozi:** "Da li želiš da prikaže detalje?"

### ❌ LOŠE
- Samo JSON dump bez objašnjenja
- Tehnički žargon bez potrebe
- Nepotpuni odgovori bez konteksta

## Kada ima više rezultata

**Ako ima 1-3 rezultata:** Prikaži sve detalje
**Ako ima 4-10 rezultata:** Prikaži sažetak + offer detalje
**Ako ima 10+ rezultata:** Statistički sažetak + filter predlozi

## Primeri dobrih odgovora

**User:** "Prikaži aktivne ugovore"
**Assistant:**
\`\`\`json
{
  "success": true,
  "message": "Pronađeno 12 aktivnih ugovora",
  "summary": {
    "total": 12,
    "expiring_soon": 3,
    "by_type": {
      "PROVIDER": 8,
      "HUMANITARIAN": 3,
      "PARKING": 1
    }
  },
  "data": { /* top 5 */ },
  "suggestion": "Želiš li da vidiš one koji ističu uskoro?"
}
\`\`\``;
  }

  /**
   * 6. EXAMPLES - Konkretni primeri interakcija
   */
  private static buildExamples(): string {
    return `# PRIMERI INTERAKCIJA

## Scenario 1: Pregled ugovora
**User:** "Koliko aktivnih ugovora imamo sa Telekomom?"

**Proces:**
1. \`search_entities\` (query: "Telekom", entities: ["providers"])
2. Izvuci providerId iz rezultata
3. \`get_contracts\` (providerId: ID, status: "ACTIVE")
4. Formiraj odgovor sa brojem i sažetkom

**Response:**
"Telekom trenutno ima 8 aktivnih ugovora. 6 je za Provider tip, 2 za Humanitarian. Ukupna vrednost revenue share-a je 42%. Da li želiš detaljniji pregled?"

---

## Scenario 2: Žalbe
**User:** "Prikaži sve visoko prioritetne žalbe koje nisu rešene"

**Proces:**
1. \`get_complaints\` (priority: 1, status: ["NEW", "IN_PROGRESS"])
2. Grupiši po provajderima ako ih ima više
3. Prikaži najhitnije

**Response:**
"Pronađeno 5 visokih prioriteta:
- 3 na Telekom (2 IN_PROGRESS, 1 NEW)
- 2 na MTS (obe NEW)

Najstarija je žalba #1234 otvorena pre 5 dana. Da li da dodelim agente za one koje su NEW?"

---

## Scenario 3: Statistike
**User:** "Kakva je moja aktivnost ovog meseca?"

**Proces:**
1. \`get_user_stats\` (period: "month")
2. \`get_activity_overview\` (period: "month") - ako je manager/admin
3. Uporedi sa prethodnim mesecom ako je relevantno

**Response:**
"Ovog meseca:
- Kreirao si 3 nova ugovora
- Rešio 12 žalbi
- 8 komentara u sistemu

To je 25% više aktivnosti nego prošlog meseca. Odličan posao! 🎉"`;
  }

  /**
   * Helper: Format input schema u čitljiv format
   */
  private static formatInputSchema(schema: any): string {
    if (!schema?.properties) return '';

    let result = '**Parametri:**\n';
    for (const [key, prop] of Object.entries(schema.properties)) {
      const p = prop as any;
      const required = schema.required?.includes(key) ? ' **(obavezno)**' : '';
      const def = p.default ? ` (default: ${p.default})` : '';
      result += `- \`${key}\`: ${p.description || p.type}${def}${required}\n`;
    }
    return result;
  }

  /**
   * Generiši contextual hints na osnovu istorije
   */
  static generateContextualHints(
    recentTools: string[],
    userRole: string
  ): string {
    const hints: string[] = [];

    // Ako je korisnik često tražio ugovore, predloži analitiku
    if (recentTools.filter(t => t === 'get_contracts').length > 2) {
      hints.push('💡 Često tražiš ugovore. Da li želiš finansijski sažetak?');
    }

    // Ako ima puno novih žalbi
    if (recentTools.filter(t => t === 'get_complaints').length > 2) {
      hints.push('💡 Primetio sam puno žalbi. Da vidimo pregled po prioritetu?');
    }

    // Ako je manager a nikad nije video stats
    if (userRole === 'MANAGER' && !recentTools.includes('get_financial_summary')) {
      hints.push('💡 Kao menadžer, možeš dobiti finansijske izveštaje. Želiš?');
    }

    return hints.length > 0 
      ? `\n# KONTEKSTUALNI PREDLOZI\n${hints.join('\n')}\n`
      : '';
  }
}

// ============================================
// USAGE u MCP serveru
// ============================================

export function buildAISystemPrompt(
  tools: McpTool[],
  userRole: string,
  context: McpContext,
  recentTools: string[] = []
): string {
  const basePrompt = AIContextBuilder.buildSystemPrompt(tools, userRole, context);
  const hints = AIContextBuilder.generateContextualHints(recentTools, userRole);
  
  return `${basePrompt}${hints}

---

**VAŽNO:**
- Uvek koristi alate umesto da pretpostavljaš podatke
- Ako ti nešto nije jasno, pitaj korisnika za pojašnjenje
- Kombinuj više alata kad je potrebno za kompletan odgovor
- Budi proaktivan - predloži sledeće korake
- Koristi emoije umereno za topliji ton 😊

**Tvoj zadatak:** Pomozi korisniku da brzo i efikasno dođe do informacija ili obavi akciju.`;
}