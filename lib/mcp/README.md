# MCP (Model Context Protocol) System - Dokumentacija

## 📋 Pregled

MCP sistem omogućava AI asistentu da izvršava strukturirane operacije nad bazom podataka kroz definisane "alate" (tools). Sistem je dizajniran da:

- ✅ Obezbedi **type-safe** pristup podacima
- 🔒 Implementira **role-based permissions**
- 📊 Automatski **loguje sve operacije**
- 🤖 Generiše **AI-friendly kontekst** za prirodno razumevanje
- 🛡️ Validira parametre pre izvršavanja

## 🏗️ Arhitektura

```
lib/mcp/
├── types.ts                  # TypeScript definicije
├── internal-server.ts        # Glavni MCP server (READ + ANALYTICS + SYSTEM tools)
├── write-tools.ts            # Write operacije (CREATE, UPDATE, DELETE)
├── ai-context-builder.ts     # AI prompt generator
├── query-logger.ts           # Logging sistem
└── index.ts                  # Exports
```

## 🔧 Komponente

### 1. **InternalMcpServer** (`internal-server.ts`)

Glavni server koji upravlja svim alatima.

**Ključne metode:**
- `getToolsForRole(role: string)` - Vraća alate dostupne za datu ulogu
- `executeTool(toolName, params, context)` - Izvršava alat

**Tool kategorije:**
- **READ** - Čitanje podataka (`get_contracts`, `get_providers`, `get_complaints`, `search_entities`)
- **WRITE** - Izmena podataka (delegira na `WriteOperations`)
- **ANALYTICS** - Statistike (`get_user_stats`, `get_financial_summary`, `get_activity_overview`)
- **SYSTEM** - Sistemske operacije (`export_data`, `get_system_health`)

### 2. **WriteOperations** (`write-tools.ts`)

Klasa koja upravlja svim write operacijama.

**Write alati:**
- `create_complaint` - Kreiranje žalbe
- `update_complaint` - Ažuriranje žalbe
- `add_complaint_comment` - Dodavanje komentara
- `create_contract` - Kreiranje ugovora
- `update_contract` - Ažuriranje ugovora
- `create_provider` - Kreiranje provajdera
- `update_provider` - Ažuriranje provajdera
- `delete_contract` - Soft delete ugovora (ADMIN only)
- `bulk_update_contracts` - Bulk update (ADMIN only)
- `create_humanitarian_org` - Kreiranje humanitarne organizacije (ADMIN only)

### 3. **AIContextBuilder** (`ai-context-builder.ts`)

Generiše optimizovane AI prompte sa:
- Opisom uloge korisnika
- Dostupnim alatima i primerima
- Use-case vodičem
- Relacijama podataka
- Contextual hints na osnovu istorije

### 4. **Query Logger** (`query-logger.ts`)

Automatski loguje sve MCP operacije u `ActivityLog` tabelu.

**Funkcionalnosti:**
- `logQuery()` - Loguje pojedinačni poziv
- `getUserQueryLogs()` - Vraća logove za korisnika
- `getToolUsageStats()` - Statistika korišćenja alata
- `getMostUsedTools()` - Najčešće korišćeni alati

## 🚀 Korišćenje

### Osnovno

```typescript
import { InternalMcpServer } from '@/lib/mcp/internal-server';

const mcpServer = new InternalMcpServer();

// 1. Dobij alate za ulogu
const tools = mcpServer.getToolsForRole('MANAGER');

// 2. Izvršavanje alata
const result = await mcpServer.executeTool(
  'get_contracts',
  { status: 'ACTIVE', limit: 10 },
  { userId: 'user123', userRole: 'MANAGER' }
);

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

### U API Route (`app/api/chat/route.ts`)

```typescript
import { InternalMcpServer } from '@/lib/mcp/internal-server';
import { AIContextBuilder } from '@/lib/mcp/ai-context-builder';

const mcpServer = new InternalMcpServer();

// Generiši AI context
const tools = mcpServer.getToolsForRole(userRole);
const systemPrompt = AIContextBuilder.buildSystemPrompt(tools, userRole, context);

// Proslijedi AI-u
const aiResponse = await callOpenRouter(systemPrompt, userQuery);

// Parsiranje i izvršavanje tool call-a
if (aiResponse.includes('Koristim alat:')) {
  const { toolName, params } = parseToolCall(aiResponse);
  const result = await mcpServer.executeTool(toolName, params, context);
  // ...
}
```

## 🔐 Permisije

### Role-Based Access Control (RBAC)

| Uloga | READ | WRITE (Basic) | WRITE (Advanced) | ANALYTICS | SYSTEM |
|-------|------|---------------|------------------|-----------|--------|
| **USER** | ✅ Svoje | ❌ | ❌ | ✅ Svoje | ❌ |
| **AGENT** | ✅ Dodeljeno | ✅ Complaints | ❌ | ✅ Svoje | ❌ |
| **MANAGER** | ✅ Sve | ✅ Contracts, Providers | ❌ | ✅ Sve | ❌ |
| **ADMIN** | ✅ Sve | ✅ Sve | ✅ Delete, Bulk | ✅ Sve | ✅ Sve |

### Provera permisija

Permisije se automatski proveravaju u `executeTool()` metodi:

```typescript
const tool = tools.find(t => t.name === toolName);
if (!tool) {
  return { success: false, error: 'Tool not available for your role' };
}
```

## 📊 Data Flow

```
1. User query → API Route
                  ↓
2. AI Context Builder → Generate system prompt
                  ↓
3. OpenRouter AI → Parse query, decide tool
                  ↓
4. MCP Server → Validate permissions & params
                  ↓
5. Tool Execution → Database operations
                  ↓
6. Query Logger → Log to ActivityLog
                  ↓
7. Format Response → Return to user
```

## 🧪 Primjeri

### Primer 1: Čitanje ugovora

```typescript
const result = await mcpServer.executeTool(
  'get_contracts',
  { 
    status: 'ACTIVE', 
    type: 'PROVIDER',
    limit: 20 
  },
  { userId: 'user123', userRole: 'MANAGER' }
);

// Result:
{
  success: true,
  data: {
    contracts: [...],
    total: 45,
    displayed: 20,
    summary: {
      active: 45,
      expired: 12,
      pending: 3
    }
  }
}
```

### Primer 2: Kreiranje žalbe (sa potvrdom)

```typescript
// Korak 1: AI identifikuje akciju i parametere
const pendingAction = {
  toolName: 'create_complaint',
  params: {
    title: 'Problem sa Telekomom',
    description: 'Internet ne radi 3 dana',
    priority: 1,
    providerId: 'prov_123'
  }
};

// Korak 2: Sistem traži potvrdu (WRITE operacija)
console.log('⚠️ Ovo će kreirati novu žalbu. Potvrdi?');

// Korak 3: Nakon potvrde, izvršavanje
const result = await mcpServer.executeTool(
  pendingAction.toolName,
  pendingAction.params,
  context
);
```

### Primer 3: Kompleksna pretraga

```typescript
const result = await mcpServer.executeTool(
  'search_entities',
  {
    query: 'Telekom',
    entities: ['contracts', 'providers', 'complaints'],
    limit: 10
  },
  { userId: 'user123', userRole: 'MANAGER' }
);

// Result:
{
  success: true,
  data: {
    contracts: [...],
    contractsTotal: 5,
    providers: [...],
    providersTotal: 1,
    complaints: [...],
    complaintsTotal: 8
  }
}
```

## 🎯 Best Practices

### 1. **Uvijek proslijedi context**

```typescript
const context: McpContext = {
  userId: session.user.id,
  userRole: session.user.role
};
```

### 2. **Handle errors gracefully**

```typescript
const result = await mcpServer.executeTool(...);

if (!result.success) {
  return NextResponse.json(
    { error: result.error },
    { status: 400 }
  );
}
```

### 3. **Validate prije write operacija**

```typescript
if (toolCategory === 'write') {
  // Traži potvrdu od korisnika
  return { message: 'Želiš da potvrdiš ovu akciju?', pending: true };
}
```

### 4. **Koristi AI Context Builder za bolje prompte**

```typescript
const systemPrompt = AIContextBuilder.buildSystemPrompt(
  tools,
  userRole,
  context
);

// + dodaj contextual hints
const hints = AIContextBuilder.generateContextualHints(
  recentTools,
  userRole
);
```

## 🔍 Debugging

### Provjera dostupnih alata

```typescript
const tools = mcpServer.getToolsForRole('MANAGER');
console.log('Available tools:', tools.map(t => t.name));
```

### Pregled logova

```typescript
import { getUserQueryLogs } from '@/lib/mcp/query-logger';

const logs = await getUserQueryLogs('user123', 50);
console.log('Recent queries:', logs);
```

### Tool usage statistika

```typescript
import { getToolUsageStats } from '@/lib/mcp/query-logger';

const stats = await getToolUsageStats('user123');
console.log('Most used:', stats.byTool);
```

## 🚧 Roadmap

- [ ] Caching rezultata READ operacija
- [ ] Rate limiting po korisniku
- [ ] Batch execution više tool-ova
- [ ] WebSocket support za real-time updates
- [ ] Export podataka u CSV/Excel
- [ ] Advanced analytics dashboard

## 📝 Contributing

Prilikom dodavanja novih alata:

1. Definiši u `internal-server.ts` ili `write-tools.ts`
2. Dodaj input schema sa validacijom
3. Implementiraj izvršavanje metode
4. Dodaj primere u `examples` field
5. Ažuriraj dokumentaciju

## 📄 License

Internal use only - MCP Contract Manager System