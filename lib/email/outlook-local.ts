import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export async function openOutlookDraft({ to, subject, body, attachments }: {
  to: string[];
  subject: string;
  body: string;
  attachments?: string[];
}) {
  // Kreiraj privremenu VBS skriptu
  const scriptPath = path.join(process.cwd(), "temp_send.vbs");
  const safeBody = body.replace(/"/g, '""');

  const vbs = `
Set Outlook = CreateObject("Outlook.Application")
Set Mail = Outlook.CreateItem(0)
Mail.To = "${to.join(";")}"
Mail.Subject = "${subject}"
Mail.Body = "${safeBody}"
`;

  const attachmentsPart = (attachments || [])
    .map(a => `Mail.Attachments.Add("${a.replace(/\\/g, "\\\\")}")`)
    .join("\n");

  const finalScript = vbs + attachmentsPart + "\nMail.Display\n";

  fs.writeFileSync(scriptPath, finalScript, "utf8");

  // Pokreni Outlook sa novim mailom
  spawn("wscript", [scriptPath], { detached: true, stdio: "ignore" });
}
