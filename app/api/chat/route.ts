// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { spawn } from 'child_process';
import { Readable, Writable } from 'stream';
import path from 'path';

// OpenRouter konfiguracija
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

interface MCPMessage {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: any;
}

class MCPClient {
  private process: any;
  private messageId = 1;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();
  
  constructor() {
    this.startMCPServer();
  }

  private startMCPServer() {
    try {
      // Pokreni MCP server kao child process
      const serverPath = path.join(process.cwd(), 'mcp-server', 'build', 'index.js');
      this.process = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.process.stdout.on('data', (data: Buffer) => {
        const responses = data.toString().trim().split('\n');
        responses.forEach(responseStr => {
          if (responseStr) {
            try {
              const response: MCPResponse = JSON.parse(responseStr);
              const pending = this.pendingRequests.get(response.id);
              if (pending) {
                this.pendingRequests.delete(response.id);
                if (response.error) {
                  pending.reject(new Error(response.error.message || 'MCP Error'));
                } else {
                  pending.resolve(response.result);
                }
              }
            } catch (e) {
              console.error('Greška pri parsiranju MCP odgovora:', e);
            }
          }
        });
      });

      this.process.stderr.on('data', (data: Buffer) => {
        console.error('MCP Server error:', data.toString());
      });

    } catch (error) {
      console.error('Greška pri pokretanju MCP servera:', error);
    }
  }

  async callTool(toolName: string, args: any): Promise<any> {
    const id = this.messageId++;
    const message: MCPMessage = {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      if (this.process && this.process.stdin) {
        this.process.stdin.write(JSON.stringify(message) + '\n');
      } else {
        reject(new Error('MCP server nije dostupan'));
      }

      // Timeout nakon 30 sekundi
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('MCP poziv je istekao'));
        }
      }, 30000);
    });
  }

  async listTools(): Promise<any> {
    const id = this.messageId++;
    const message: MCPMessage = {
      jsonrpc: '2.0',
      id,
      method: 'tools/list',
      params: {}
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      if (this.process && this.process.stdin) {
        this.process.stdin.write(JSON.stringify(message) + '\n');
      } else {
        reject(new Error('MCP server nije dostupan'));
      }

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('MCP poziv je istekao'));
        }
      }, 30000);
    });
  }
}

// Globalna instanca MCP klijenta
let mcpClient: MCPClient | null = null;

function getMCPClient(): MCPClient {
  if (!mcpClient) {
    mcpClient = new MCPClient();
  }
  return mcpClient;
}

// Funkcija za prepoznavanje i izvršavanje MCP poziva
async function processMessage(message: string): Promise<string> {
  const client = getMCPClient();
  
  // Jednostavna logika za prepoznavanje namere
  const lowerMessage = message.toLowerCase();
  
  try {
    // Ugovori
    if (lowerMessage.includes('ugovor') || lowerMessage.includes('contract')) {
      if (lowerMessage.includes('aktivn') || lowerMessage.includes('active')) {
        const result = await client.callTool('get_contracts', { status: 'ACTIVE', limit: 5 });
        return `Pronašao sam ${result.data?.length || 0} aktivnih ugovora:\n${JSON.stringify(result.data, null, 2)}`;
      }
      if (lowerMessage.includes('istek') || lowerMessage.includes('expir')) {
        const result = await client.callTool('get_contracts', { status: 'EXPIRED', limit: 5 });
        return `Pronašao sam ${result.data?.length || 0} isteklih ugovora:\n${JSON.stringify(result.data, null, 2)}`;
      }
      // Generička pretraga ugovora
      const result = await client.callTool('get_contracts', { limit: 5 });
      return `Evo najnovijih ugovora:\n${JSON.stringify(result.data, null, 2)}`;
    }
    
    // Žalbe
    if (lowerMessage.includes('žalb') || lowerMessage.includes('complaint')) {
      if (lowerMessage.includes('nov') || lowerMessage.includes('new')) {
        const result = await client.callTool('get_complaints', { status: 'NEW', limit: 5 });
        return `Pronašao sam ${result.data?.length || 0} novih žalbi:\n${JSON.stringify(result.data, null, 2)}`;
      }
      if (lowerMessage.includes('rešen') || lowerMessage.includes('resolved')) {
        const result = await client.callTool('get_complaints', { status: 'RESOLVED', limit: 5 });
        return `Pronašao sam ${result.data?.length || 0} rešenih žalbi:\n${JSON.stringify(result.data, null, 2)}`;
      }
      // Generička pretraga žalbi
      const result = await client.callTool('get_complaints', { limit: 5 });
      return `Evo najnovijih žalbi:\n${JSON.stringify(result.data, null, 2)}`;
    }
    
    // Provajderi
    if (lowerMessage.includes('provajder') || lowerMessage.includes('provider')) {
      const result = await client.callTool('get_providers', { isActive: true, limit: 5 });
      return `Pronašao sam ${result.data?.length || 0} aktivnih provajdera:\n${JSON.stringify(result.data, null, 2)}`;
    }
    
    // Servisi
    if (lowerMessage.includes('servis') || lowerMessage.includes('service')) {
      const result = await client.callTool('get_services', { isActive: true, limit: 5 });
      return `Pronašao sam ${result.data?.length || 0} aktivnih servisa:\n${JSON.stringify(result.data, null, 2)}`;
    }
    
    // Finansijski pregled
    if (lowerMessage.includes('finansij') || lowerMessage.includes('financial') || lowerMessage.includes('prihod') || lowerMessage.includes('revenue')) {
      const result = await client.callTool('get_financial_summary', {});
      return `Evo finansijskog pregleda:\n${JSON.stringify(result.data, null, 2)}`;
    }
    
    // Opšta pretraga
    if (lowerMessage.includes('pretraži') || lowerMessage.includes('search') || lowerMessage.includes('pronađi') || lowerMessage.includes('find')) {
      // Izdvoj ključne reči za pretragu
      const searchTerms = message.split(' ').filter(word => 
        word.length > 3 && 
        !['pretraži', 'search', 'pronađi', 'find', 'kroz', 'bazu', 'podataka'].includes(word.toLowerCase())
      );
      
      if (searchTerms.length > 0) {
        const result = await client.callTool('search_database', { 
          query: searchTerms.join(' '), 
          limit: 5 
        });
        return `Rezultati pretrage za "${searchTerms.join(' ')}":\n${JSON.stringify(result.data, null, 2)}`;
      }
    }
    
    return null; // Vraćamo null ako nema MCP poziva
    
  } catch (error) {
    console.error('MCP greška:', error);
    return `Dogodila se greška pri pristupu podacima: ${error.message}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, conversation = [] } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Poruka je obavezna' }, { status: 400 });
    }

    // Prvo pokušaj da obradiš poruku kroz MCP
    const mcpResponse = await processMessage(message);
    
    let systemMessage = `Ti si AI asistent za sistem upravljanja ugovorima, žalbama i servisima. 
Imaš pristup bazi podataka preko MCP servera i možeš da dohvataš informacije o:
- Ugovorima (provider, humanitarian, parking, bulk)
- Žalbama i pritužbama
- Provajderima i servisima
- Finansijskim podacima
- Humanitarnim organizacijama
- Parking servisima

Kada korisnik pita nešto što se odnosi na podatke iz baze, koristi informacije koje su ti prosleđene.
Odgovori na srpskom jeziku i budi koncizan i jasan.`;

    let messages: any[] = [
      { role: 'system', content: systemMessage }
    ];

    // Ako ima MCP podataka, dodaj ih u kontekst
    if (mcpResponse) {
      messages.push({
        role: 'system', 
        content: `Podaci iz baze: ${mcpResponse}`
      });
    }

    // Dodaj poslednje poruke iz konverzacije
    if (conversation.length > 0) {
      messages.push(...conversation.slice(-10)); // Poslednje 10 poruka
    }

    messages.push({ role: 'user', content: message });

    const completion = await openai.chat.completions.create({
      model: 'anthropic/claude-3.5-sonnet', // ili neki drugi model koji preferiraš
      messages,
      max_tokens: 1500,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'Izvini, nisam mogao da generišem odgovor.';

    return NextResponse.json({ 
      message: reply,
      hasMCPData: !!mcpResponse 
    });

  } catch (error) {
    console.error('Greška u chat API:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške pri obradi zahteva' },
      { status: 500 }
    );
  }
}