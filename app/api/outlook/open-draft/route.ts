import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  const { to, cc, subject, body, attachments } = await req.json();

  return new Promise((resolve) => {
    const scriptPath = path.resolve('./scripts/createOutlookDraft.ps1');
    const args = [
      '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      '-to', to,
      '-cc', cc,
      '-subject', subject,
      '-body', body,
      '-attachments', ...attachments
    ];

    execFile('powershell.exe', args, (error, stdout, stderr) => {
      if (error) {
        console.error(error);
        resolve(NextResponse.json({ success: false, error: error.message }, { status: 500 }));
      } else {
        resolve(NextResponse.json({ success: true, output: stdout }));
      }
    });
  });
}
