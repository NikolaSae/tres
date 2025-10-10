// lib/mcp/email-tools.ts - Sa Upload Funkcionalnostima

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import { existsSync } from 'fs';
import type { McpContext, McpResult, McpTool } from './types';

/**
 * Email Processing za MCP Server
 * Parsira .eml fajlove i detektuje reklamacije
 */
export class EmailOperations {
  private emailDirectory: string;
  private processedDataFile: string;

  constructor() {
    // Definiši putanje - adjust prema tvom projektu
    this.emailDirectory = join(process.cwd(), 'data', 'emails');
    this.processedDataFile = join(process.cwd(), 'data', 'emails', 'processed_emails.json');
  }

  /**
   * Vraća email alate dostupne za datu ulogu
   */
  getEmailToolsForRole(role: string): Omit<McpTool, 'category'>[] {
    const tools: Omit<McpTool, 'category'>[] = [];

    // Svi korisnici mogu da skeniraju, parsiraju i uploaduju emailove
    tools.push(
      {
        name: 'upload_eml_file',
        description: 'Upload .eml file from chat attachment to email processing directory',
        examples: [
          'Uploaduj ovaj .eml fajl',
          'Dodaj email fajl u sistem',
          'Sačuvaj ovaj email'
        ],
        inputSchema: {
          type: 'object',
          properties: {
            fileName: {
              type: 'string',
              description: 'Name of the uploaded file (from chat attachment)'
            },
            autoScan: {
              type: 'boolean',
              default: true,
              description: 'Automatically scan after upload'
            }
          },
          required: ['fileName']
        }
      },
      {
        name: 'scan_emails',
        description: 'Scan email directory and parse all .eml files',
        examples: [
          'Skeniraj sve emailove',
          'Parsiraj sve .eml fajlove',
          'Učitaj emailove iz foldera'
        ],
        inputSchema: {
          type: 'object',
          properties: {
            forceRefresh: {
              type: 'boolean',
              default: false,
              description: 'Force re-parsing even if processed data exists'
            }
          }
        }
      },
      {
        name: 'get_emails',
        description: 'Get parsed emails with filtering options',
        examples: [
          'Prikaži sve emailove',
          'Emailovi od example@telekom.rs',
          'Emailovi sa subjektom "reklamacija"'
        ],
        inputSchema: {
          type: 'object',
          properties: {
            from: { type: 'string', description: 'Filter by sender email' },
            to: { type: 'string', description: 'Filter by recipient email' },
            subject: { type: 'string', description: 'Search in subject (partial match)' },
            body: { type: 'string', description: 'Search in body (partial match)' },
            dateFrom: { type: 'string', format: 'date', description: 'Start date' },
            dateTo: { type: 'string', format: 'date', description: 'End date' },
            limit: { type: 'number', default: 50 }
          }
        }
      }
    );

    // Manager i Admin dobijaju dodatne alate
    if (['ADMIN', 'MANAGER', 'AGENT'].includes(role)) {
      tools.push(
        {
          name: 'detect_complaints',
          description: 'Detect emails that contain complaints and categorize them',
          examples: [
            'Pronađi sve reklamacije',
            'Detektuj žalbe u emailovima',
            'Hitne reklamacije'
          ],
          inputSchema: {
            type: 'object',
            properties: {
              urgentOnly: {
                type: 'boolean',
                default: false,
                description: 'Return only urgent complaints'
              },
              unassignedOnly: {
                type: 'boolean',
                default: false,
                description: 'Return only complaints not yet converted to tickets'
              }
            }
          },
          requiredRole: ['ADMIN', 'MANAGER', 'AGENT']
        },
        {
          name: 'analyze_email_conversation',
          description: 'Analyze email thread/conversation and extract key information',
          examples: [
            'Analiziraj konverzaciju',
            'Šta klijent zapravo traži?',
            'Sažetak email prepiske'
          ],
          inputSchema: {
            type: 'object',
            properties: {
              emailId: {
                type: 'string',
                description: 'ID of the email to analyze'
              }
            },
            required: ['emailId']
          },
          requiredRole: ['ADMIN', 'MANAGER', 'AGENT']
        }
      );
    }

    // Samo Admin može da kreira žalbe iz emailova
    if (role === 'ADMIN' || role === 'MANAGER') {
      tools.push({
        name: 'create_complaint_from_email',
        description: 'Convert email into a formal complaint/ticket',
        examples: [
          'Kreiraj žalbu iz emaila #123',
          'Napravi tiket od ove reklamacije'
        ],
        inputSchema: {
          type: 'object',
          properties: {
            emailId: {
              type: 'string',
              description: 'ID of the email to convert'
            },
            assignToAgent: {
              type: 'string',
              description: 'User ID of agent to assign (optional)'
            },
            priority: {
              type: 'number',
              minimum: 1,
              maximum: 5,
              default: 3,
              description: 'Priority level (1=highest, 5=lowest)'
            }
          },
          required: ['emailId']
        },
        requiredRole: ['ADMIN', 'MANAGER']
      });
    }

    return tools;
  }

  /**
   * Izvršava email alat
   */
  async executeEmailTool(
    toolName: string,
    params: any,
    context: McpContext
  ): Promise<McpResult> {
    try {
      switch (toolName) {
        case 'upload_eml_file':
          return await this.uploadEmlFile(params, context);
        case 'scan_emails':
          return await this.scanEmails(params, context);
        case 'get_emails':
          return await this.getEmails(params, context);
        case 'detect_complaints':
          return await this.detectComplaints(params, context);
        case 'analyze_email_conversation':
          return await this.analyzeEmailConversation(params, context);
        case 'create_complaint_from_email':
          return await this.createComplaintFromEmail(params, context);
        default:
          return { success: false, error: `Unknown email tool: ${toolName}` };
      }
    } catch (error) {
      console.error(`Email tool error [${toolName}]:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ============================================
  // TOOL IMPLEMENTATIONS
  // ============================================

  /**
   * Uploaduje .eml fajl iz chata u email direktorijum
   * Koristi window.fs.readFile API za čitanje attachmenta
   */
  private async uploadEmlFile(params: any, context: McpContext): Promise<McpResult> {
    try {
      const { fileName, autoScan = true } = params;

      // Proveri da li folder postoji
      if (!existsSync(this.emailDirectory)) {
        await mkdir(this.emailDirectory, { recursive: true });
      }

      // Validacija file extension
      if (!fileName.toLowerCase().endsWith('.eml')) {
        return {
          success: false,
          error: 'Only .eml files are supported'
        };
      }

      // IMPORTANT: Ovo će raditi samo u AI chat environment gde postoji window.fs.readFile
      // Za server-side pozive, koristiti direktan file upload preko API-ja
      let fileContent: string;
      
      try {
        // Pokušaj da pročitaš fajl kroz window.fs.readFile (chat attachment)
        if (typeof window !== 'undefined' && (window as any).fs?.readFile) {
          const data = await (window as any).fs.readFile(fileName, { encoding: 'utf8' });
          fileContent = data;
        } else {
          return {
            success: false,
            error: 'File upload from chat not available. Use API endpoint for manual upload.'
          };
        }
      } catch (readError) {
        return {
          success: false,
          error: `Could not read file "${fileName}". Make sure it's attached to the chat. Error: ${readError instanceof Error ? readError.message : 'Unknown error'}`
        };
      }

      // Sačuvaj u email directory
      const targetPath = join(this.emailDirectory, basename(fileName));
      await writeFile(targetPath, fileContent, 'utf-8');

      // Auto-scan ako je traženo
      let scanResult = null;
      if (autoScan) {
        scanResult = await this.scanEmails({ forceRefresh: true }, context);
      }

      return {
        success: true,
        data: {
          fileName: basename(fileName),
          path: targetPath,
          size: fileContent.length,
          autoScanned: autoScan,
          scanResult: scanResult?.success ? scanResult.data : null
        },
        message: `File "${basename(fileName)}" uploaded successfully${autoScan ? ' and scanned' : ''}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Skenira sve .eml fajlove i parsira ih
   */
  private async scanEmails(params: any, context: McpContext): Promise<McpResult> {
    try {
      // Proveri da li folder postoji
      if (!existsSync(this.emailDirectory)) {
        await mkdir(this.emailDirectory, { recursive: true });
        return {
          success: true,
          data: { emails: [], total: 0 },
          message: 'Email directory created. Please add .eml files to it.'
        };
      }

      // Ako postoje već parsirani podaci i nema force refresh
      if (!params.forceRefresh && existsSync(this.processedDataFile)) {
        const data = await readFile(this.processedDataFile, 'utf-8');
        const parsed = JSON.parse(data);
        return {
          success: true,
          data: parsed,
          message: `Loaded ${parsed.emails.length} cached emails. Use forceRefresh: true to re-scan.`
        };
      }

      // Skeniraj folder
      const files = await readdir(this.emailDirectory);
      const emlFiles = files.filter(f => f.toLowerCase().endsWith('.eml'));

      if (emlFiles.length === 0) {
        return {
          success: true,
          data: { emails: [], total: 0 },
          message: 'No .eml files found in directory'
        };
      }

      // Parsiraj svaki fajl
      const emails = [];
      for (const file of emlFiles) {
        const filePath = join(this.emailDirectory, file);
        const parsed = await this.parseEmlFile(filePath);
        if (parsed) {
          emails.push({
            ...parsed,
            id: this.generateEmailId(parsed),
            sourceFile: file,
            scannedAt: new Date().toISOString()
          });
        }
      }

      // Sortiraj po datumu
      emails.sort((a, b) => {
        const dateA = a.date_parsed ? new Date(a.date_parsed).getTime() : 0;
        const dateB = b.date_parsed ? new Date(b.date_parsed).getTime() : 0;
        return dateB - dateA;
      });

      // Sačuvaj u fajl
      const result = {
        emails,
        total: emails.length,
        scannedAt: new Date().toISOString(),
        directory: this.emailDirectory
      };

      await writeFile(this.processedDataFile, JSON.stringify(result, null, 2), 'utf-8');

      return {
        success: true,
        data: result,
        message: `Successfully scanned and parsed ${emails.length} emails`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to scan emails: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Dohvata filtrirane emailove
   */
  private async getEmails(params: any, context: McpContext): Promise<McpResult> {
    try {
      // Učitaj parsirane emailove
      if (!existsSync(this.processedDataFile)) {
        return {
          success: false,
          error: 'No parsed emails found. Run scan_emails first.'
        };
      }

      const data = await readFile(this.processedDataFile, 'utf-8');
      const { emails } = JSON.parse(data);

      // Primeni filtere
      let filtered = emails;

      if (params.from) {
        filtered = filtered.filter((e: any) => 
          e.from?.toLowerCase().includes(params.from.toLowerCase())
        );
      }

      if (params.to) {
        filtered = filtered.filter((e: any) =>
          e.to?.toLowerCase().includes(params.to.toLowerCase())
        );
      }

      if (params.subject) {
        filtered = filtered.filter((e: any) =>
          e.subject?.toLowerCase().includes(params.subject.toLowerCase())
        );
      }

      if (params.body) {
        filtered = filtered.filter((e: any) =>
          e.body?.toLowerCase().includes(params.body.toLowerCase())
        );
      }

      if (params.dateFrom) {
        const fromDate = new Date(params.dateFrom);
        filtered = filtered.filter((e: any) => 
          e.date_parsed && new Date(e.date_parsed) >= fromDate
        );
      }

      if (params.dateTo) {
        const toDate = new Date(params.dateTo);
        filtered = filtered.filter((e: any) =>
          e.date_parsed && new Date(e.date_parsed) <= toDate
        );
      }

      // Limituj rezultate
      const limit = params.limit || 50;
      const limited = filtered.slice(0, limit);

      return {
        success: true,
        data: {
          emails: limited,
          total: emails.length,
          filtered: filtered.length,
          displayed: limited.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get emails: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Detektuje reklamacije u emailovima
   */
  private async detectComplaints(params: any, context: McpContext): Promise<McpResult> {
    try {
      if (!existsSync(this.processedDataFile)) {
        return {
          success: false,
          error: 'No parsed emails found. Run scan_emails first.'
        };
      }

      const data = await readFile(this.processedDataFile, 'utf-8');
      const { emails } = JSON.parse(data);

      // Analiziraj svaki email
      const complaints = [];
      for (const email of emails) {
        const analysis = this.analyzeForComplaint(email);
        if (analysis.isComplaint) {
          if (params.urgentOnly && !analysis.isUrgent) continue;
          complaints.push({
            ...email,
            analysis
          });
        }
      }

      // Sortiraj po prioritetu
      complaints.sort((a, b) => {
        if (a.analysis.isUrgent && !b.analysis.isUrgent) return -1;
        if (!a.analysis.isUrgent && b.analysis.isUrgent) return 1;
        return 0;
      });

      return {
        success: true,
        data: {
          complaints,
          total: complaints.length,
          urgent: complaints.filter(c => c.analysis.isUrgent).length,
          summary: {
            high_confidence: complaints.filter(c => c.analysis.confidence === 'high').length,
            medium_confidence: complaints.filter(c => c.analysis.confidence === 'medium').length,
            low_confidence: complaints.filter(c => c.analysis.confidence === 'low').length
          }
        },
        message: `Found ${complaints.length} potential complaints (${complaints.filter(c => c.analysis.isUrgent).length} urgent)`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to detect complaints: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Analizira email konverzaciju
   */
  private async analyzeEmailConversation(params: any, context: McpContext): Promise<McpResult> {
    try {
      if (!existsSync(this.processedDataFile)) {
        return {
          success: false,
          error: 'No parsed emails found. Run scan_emails first.'
        };
      }

      const data = await readFile(this.processedDataFile, 'utf-8');
      const { emails } = JSON.parse(data);

      const email = emails.find((e: any) => e.id === params.emailId);
      if (!email) {
        return {
          success: false,
          error: `Email with ID ${params.emailId} not found`
        };
      }

      // Pronađi sve povezane emailove (isti subject)
      const thread = emails.filter((e: any) => 
        e.subject && email.subject && 
        this.normalizeSubject(e.subject) === this.normalizeSubject(email.subject)
      );

      thread.sort((a: any, b: any) => {
        const dateA = a.date_parsed ? new Date(a.date_parsed).getTime() : 0;
        const dateB = b.date_parsed ? new Date(b.date_parsed).getTime() : 0;
        return dateA - dateB;
      });

      // Ekstraktuj ključne informacije
      const analysis = {
        threadLength: thread.length,
        participants: [...new Set(thread.flatMap((e: any) => [e.from, e.to]))],
        timeline: thread.map((e: any) => ({
          date: e.date_parsed,
          from: e.from,
          summary: e.body?.substring(0, 100) + '...'
        })),
        sentiment: this.analyzeSentiment(thread),
        actionItems: this.extractActionItems(thread),
        isComplaint: this.analyzeForComplaint(email).isComplaint
      };

      return {
        success: true,
        data: {
          email,
          thread,
          analysis
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Kreira žalbu iz emaila
   */
  private async createComplaintFromEmail(params: any, context: McpContext): Promise<McpResult> {
    try {
      if (!existsSync(this.processedDataFile)) {
        return {
          success: false,
          error: 'No parsed emails found. Run scan_emails first.'
        };
      }

      const data = await readFile(this.processedDataFile, 'utf-8');
      const { emails } = JSON.parse(data);

      const email = emails.find((e: any) => e.id === params.emailId);
      if (!email) {
        return {
          success: false,
          error: `Email with ID ${params.emailId} not found`
        };
      }

      const analysis = this.analyzeForComplaint(email);

      // Pripremi podatke za kreiranje žalbe
      const complaintData = {
        title: email.subject || 'Reklamacija iz emaila',
        description: email.body || '',
        priority: params.priority || (analysis.isUrgent ? 1 : 3),
        status: 'NEW',
        submittedByEmail: email.from,
        assignedAgentId: params.assignToAgent || null,
        metadata: {
          source: 'email',
          emailId: email.id,
          sourceFile: email.sourceFile,
          detectedKeywords: analysis.keywordsFound,
          confidence: analysis.confidence
        }
      };

      // TODO: Ovde treba pozvati db.complaint.create()
      // Za sada vraćamo mock odgovor
      return {
        success: true,
        data: {
          complaint: complaintData,
          email: email
        },
        message: `Complaint created from email ${email.id}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create complaint: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Parsira .eml fajl
   */
  private async parseEmlFile(filePath: string): Promise<any> {
    try {
      const content = await readFile(filePath, 'utf-8');
      
      // Jednostavan parser - možeš koristiti biblioteku kao 'mailparser'
      const lines = content.split('\n');
      const email: any = {
        from: null,
        to: null,
        cc: null,
        subject: null,
        date: null,
        body: ''
      };

      let inBody = false;
      let currentHeader = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (!inBody) {
          if (line.trim() === '') {
            inBody = true;
            continue;
          }

          if (line.startsWith('From: ')) {
            email.from = line.substring(6).trim();
          } else if (line.startsWith('To: ')) {
            email.to = line.substring(4).trim();
          } else if (line.startsWith('Cc: ')) {
            email.cc = line.substring(4).trim();
          } else if (line.startsWith('Subject: ')) {
            email.subject = line.substring(9).trim();
          } else if (line.startsWith('Date: ')) {
            email.date = line.substring(6).trim();
            try {
              email.date_parsed = new Date(email.date).toISOString();
            } catch (e) {
              email.date_parsed = null;
            }
          }
        } else {
          email.body += line + '\n';
        }
      }

      email.body = this.cleanEmailBody(email.body);

      return email;
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Čisti telo emaila
   */
  private cleanEmailBody(body: string): string {
    const removePatterns = [
      /^--\s*$/gm,
      /^Poverljive informacije.*/gim,
      /^Skrećemo vam pažnju.*/gim,
      /^Sačuvajmo drveće.*/gim,
      /^Save a tree.*/gim,
      /^\*{3,}.*/gm,
      /^─{10,}.*/gm,
      /^Adresa:.*/gim,
      /^• m:.*/gim,
      /^http[s]?:\/\/.*/gm
    ];

    let cleaned = body;
    for (const pattern of removePatterns) {
      cleaned = cleaned.replace(pattern, '');
    }

    return cleaned.trim();
  }

  /**
   * Analizira email za reklamaciju
   */
  private analyzeForComplaint(email: any): {
    isComplaint: boolean;
    isUrgent: boolean;
    confidence: 'high' | 'medium' | 'low';
    keywordsFound: string[];
  } {
    const text = `${email.subject || ''} ${email.body || ''}`.toLowerCase();

    const complaintKeywords = [
      'reklamacija', 'complaint', 'problem', 'issue', 'не ради', 'ne radi',
      'greška', 'error', 'bug', 'kvar', 'defekt', 'žalba', 'prigovor'
    ];

    const urgentKeywords = [
      'hitno', 'urgent', 'asap', 'immediately', 'odmah', 'critical', 'kritično'
    ];

    const foundComplaint = complaintKeywords.filter(kw => text.includes(kw));
    const foundUrgent = urgentKeywords.filter(kw => text.includes(kw));

    const isComplaint = foundComplaint.length > 0;
    const isUrgent = foundUrgent.length > 0;

    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (foundComplaint.length >= 2) confidence = 'high';
    else if (foundComplaint.length === 1) confidence = 'medium';

    return {
      isComplaint,
      isUrgent,
      confidence,
      keywordsFound: [...foundComplaint, ...foundUrgent]
    };
  }

  /**
   * Normalizuje subject za grupisanje thread-ova
   */
  private normalizeSubject(subject: string): string {
    return subject
      .replace(/^(re|fwd|fw):\s*/gi, '')
      .trim()
      .toLowerCase();
  }

  /**
   * Analizira sentiment konverzacije
   */
  private analyzeSentiment(thread: any[]): string {
    // Simplistička analiza - možeš koristiti AI API za detaljnije
    const allText = thread.map(e => e.body || '').join(' ').toLowerCase();
    
    const negativeWords = ['problem', 'issue', 'loš', 'bad', 'ne radi', 'greška'];
    const positiveWords = ['hvala', 'thank', 'odlično', 'great', 'super'];

    const negCount = negativeWords.filter(w => allText.includes(w)).length;
    const posCount = positiveWords.filter(w => allText.includes(w)).length;

    if (negCount > posCount * 2) return 'negative';
    if (posCount > negCount * 2) return 'positive';
    return 'neutral';
  }

  /**
   * Ekstraktuje action items iz thread-a
   */
  private extractActionItems(thread: any[]): string[] {
    const actions: string[] = [];
    const allText = thread.map(e => e.body || '').join('\n');

    // Traži rečenice sa action verb-ovima
    const actionPatterns = [
      /(?:molim|please|potrebno je|need to|treba da)\s+(.{10,100})/gi
    ];

    for (const pattern of actionPatterns) {
      const matches = allText.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) actions.push(match[1].trim());
      }
    }

    return actions.slice(0, 5); // Max 5 action items
  }

  /**
   * Generiše jedinstveni ID za email
   */
  private generateEmailId(email: any): string {
    const str = `${email.from}-${email.subject}-${email.date}`;
    return Buffer.from(str).toString('base64').substring(0, 16);
  }
}

export const emailOperations = new EmailOperations();