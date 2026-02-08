// app/api/outlook/open-draft/route.ts
import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { to, cc, subject, body, attachments } = await req.json();

    const scriptPath = path.resolve('./scripts/createOutlookDraft.ps1');

    const args = [
      '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      '-to', to,
      '-cc', cc || '',          // ← fallback ako cc nije prosleđen
      '-subject', subject,
      '-body', body,
      '-attachments', ...(attachments || []),  // ← sigurnije, fallback na prazan array
    ];

    // Wrap execFile u Promise – ovo je ključna izmena
    const { stdout, stderr } = await new Promise<{
      stdout: string;
      stderr: string;
    }>((resolve, reject) => {
      execFile('powershell.exe', args, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });

    if (stderr) {
      console.warn('PowerShell stderr:', stderr);
      // Možeš odlučiti da li je ovo error ili ne – zavisi od tvog skripta
    }

    return NextResponse.json({
      success: true,
      output: stdout.trim(),
    });

  } catch (error: any) {
    console.error('Error creating Outlook draft:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to execute PowerShell script',
      },
      { status: 500 }
    );
  }
}