// /app/help/documentation/DocumentationServer.tsx
import fs from "fs";
import path from "path";
import DocumentationClient from "./DocumentationClient";

export default function DocumentationServer() {
  const appStructurePath = path.join(process.cwd(), "PROJECT_STRUCTURE.md");
  const appDocPath = path.join(process.cwd(), "PROJECT_DOCUMENTATION.md");
  const apiStructurePath = path.join(process.cwd(), "PROJECT_API_STRUCTURE.md");
  const apiDocPath = path.join(process.cwd(), "PROJECT_API_DOCUMENTATION.md");

  const appStructure = fs.readFileSync(appStructurePath, "utf-8");
  const appDocumentation = fs.readFileSync(appDocPath, "utf-8");
  const apiStructure = fs.readFileSync(apiStructurePath, "utf-8");
  const apiDocumentation = fs.readFileSync(apiDocPath, "utf-8");

  return (
    <DocumentationClient
      appStructure={appStructure}
      appDocumentation={appDocumentation}
      apiStructure={apiStructure}
      apiDocumentation={apiDocumentation}
    />
  );
}
