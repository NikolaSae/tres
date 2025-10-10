import { execFile } from "child_process";
import path from "path";

export const createOutlookDraft = ({
  to,
  cc,
  subject,
  body,
  attachments
}: {
  to: string;
  cc: string;
  subject: string;
  body: string;
  attachments: string[];
}) => {
  const psFile = path.join(process.cwd(), "scripts", "createOutlookDraft.ps1");

  // PowerShell argumenti
  const args = [
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    psFile,
    "-to", to,
    "-cc", cc,
    "-subject", subject,
    "-body", body,
    "-attachments", attachments.join(",")
  ];

  return new Promise<void>((resolve, reject) => {
    execFile("powershell.exe", args, (err, stdout, stderr) => {
      if (err) return reject(err);
      if (stderr) console.warn(stderr);
      console.log(stdout);
      resolve();
    });
  });
};
