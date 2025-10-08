import ReactMarkdown from "react-markdown";
import fs from "fs";
import path from "path";

export default function HelpHumanitarianOrgs() {
  const structure = fs.readFileSync(
    path.join(process.cwd(), "PROJECT_STRUCTURE.md"),
    "utf-8"
  );
  const documentation = fs.readFileSync(
    path.join(process.cwd(), "PROJECT_DOCUMENTATION.md"),
    "utf-8"
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Humanitarian Orgs Documentation</h1>
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Project Structure</h2>
        <ReactMarkdown>{structure}</ReactMarkdown>
      </section>
      <section>
        <h2 className="font-semibold mb-2">Project Documentation</h2>
        <ReactMarkdown>{documentation}</ReactMarkdown>
      </section>
    </div>
  );
}
