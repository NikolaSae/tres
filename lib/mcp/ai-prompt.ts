// lib/mcp/ai-prompt-example.ts

/**
 * PRIMER UPOTREBE - Ovaj fajl sadrži primere koda
 * Ne izvršava se direktno, već služi kao dokumentacija
 */

// ✅ Dodaj export da bude modul
export {};

// Primer 1: Osnovni AI sistem prompt
const aiSystemPrompt = `
You are an AI assistant with access to a Model Context Protocol server that exposes both read and write tools.
...
Always respond in structured JSON:
{
  success: true|false,
  message: string,
  data: any (optional)
}
`;

// Primer 2: Pozivanje MCP tool-a (zakomentarisano jer je samo primer)
/*
const response = await mcpClient.callTool({
  name: 'search_entities',
  arguments: { query: 'Example' },
  systemPrompt: aiSystemPrompt
});
*/

// Primer 3: Struktura poziva
const exampleToolCall = {
  name: 'search_entities',
  arguments: { 
    query: 'Telekom',
    entities: ['providers', 'contracts']
  }
};

console.log('Example tool call structure:', exampleToolCall);