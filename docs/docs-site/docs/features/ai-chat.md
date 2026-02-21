---
id: ai-chat
title: AI Chat & MCP Integracija
sidebar_label: 🤖 AI Chat
---

# AI Chat & MCP Integracija

TRES ima ugrađen AI chat koji razume kontekst aplikacije i može odgovarati na pitanja o podacima direktno iz baze.

## AI Chat

### Kako pristupiti

Floating chat dugme je dostupno u donjem desnom uglu na svim zaštićenim stranicama, ili direktno:

```
/chat
```

### Šta AI zna?

AI chat ima pristup:
- Svim ugovorima (pretraga, statistike, isteci)
- Provajderima i uslugama
- Humanitarnim organizacijama
- Parking servisima
- Prigovorima i statusima
- Finansijskim podacima

### Primeri pitanja

```
"Koji ugovori ističu ovog meseca?"
"Koliko ima otvorenih prigovora za Infobip?"
"Koji je ukupan prihod za parking u Nišu u 2025?"
"Prikaži mi sve humanitarne organizacije sa kratkim brojem između 1000 i 2000"
```

## MCP (Model Context Protocol)

TRES implementira MCP server koji omogućava AI agentima da direktno čitaju i pišu podatke.

### MCP Server

Poseban Node.js proces u `mcp-server/`:

```bash
cd mcp-server
npm install
npm run dev
```

MCP server sluša na konfigurabilnom portu i prima JSON-RPC zahteve od AI agenata.

### Read operacije (alati za čitanje)

```typescript
// lib/mcp/read-operations.ts
tools:
  - get_contracts       — Lista ugovora sa filterima
  - get_providers       — Lista provajdera
  - get_complaints      — Lista prigovora
  - get_parking_stats   — Statistike parking servisa
  - get_humanitarian_orgs — Lista humanitarnih org.
  - search_database     — Slobodna pretraga
```

### Write operacije (alati za pisanje)

```typescript
// lib/mcp/write-tools.ts
tools:
  - create_complaint    — Kreira novi prigovor
  - update_contract_status — Menja status ugovora
  - assign_complaint    — Dodeljuje prigovor korisniku
```

### Admin MCP endpoint

```
/admin/aidash — AI dashboard za admina
POST /api/admin/mcp — MCP proxy endpoint
```

## Email obrada sa AI

TRES može automatski obrađivati dolazeće emailove sa prigovorima koristeći AI:

### Kako radi

1. Email stiže na konfigurisanu adresu
2. Python skripta (`scripts/email_processor.py`) parsira `.eml` fajl
3. AI ekstrahuje podatke (podnosilac, provajder, opis, iznos)
4. Automatski kreira draft prigovora u sistemu
5. Operater pregleda i potvrđuje

### Pokretanje email procesora

```bash
python scripts/email_processor.py --input scripts/email/ --output scripts/processed/
```

## AI Context Builder

```typescript
// lib/mcp/ai-context-builder.ts
// Gradi kontekst za AI model iz podataka baze
// Uključuje relevantne entitete na osnovu korisničkog upita
```

## Query Logger

MCP server loguje sve AI upite za audit i debugging:

```
Admin → Security → AI Query Logs
```

Vidljivi su: upit, AI odgovor, vreme izvršavanja, korisnik.