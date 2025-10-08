// /lib/docs.ts
import fs from "fs";
import path from "path";

export function getMarkdown(fileName: string) {
  const filePath = path.join(process.cwd(), "docs", fileName);
  return fs.readFileSync(filePath, "utf-8");
}
