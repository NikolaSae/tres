// /lib/docs.ts
import fs from "fs";
import path from "path";

export function getMarkdown(fileName: string) {
  const filePath = path.join(process.cwd(), "docs", fileName);
  return fs.readFileSync(filePath, "utf-8");
}

export interface TocItem {
  text: string;
  level: number;
  id: string;
}

export function extractTableOfContents(markdown: string): TocItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const toc: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    // Create ID from heading text (lowercase, replace spaces with hyphens)
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    toc.push({
      text,
      level,
      id,
    });
  }

  return toc;
}

export function getAllMarkdownFiles(): string[] {
  const docsDirectory = path.join(process.cwd(), "docs");
  
  try {
    const files = fs.readdirSync(docsDirectory);
    return files.filter(file => file.endsWith('.md'));
  } catch (error) {
    console.error("Error reading docs directory:", error);
    return [];
  }
}

export interface DocMetadata {
  fileName: string;
  title: string;
  slug: string;
}

export function getDocMetadata(fileName: string): DocMetadata {
  const content = getMarkdown(fileName);
  const toc = extractTableOfContents(content);
  const title = toc[0]?.text || fileName.replace('.md', '');
  const slug = fileName.replace('.md', '').toLowerCase().replace(/_/g, '-');

  return {
    fileName,
    title,
    slug,
  };
}

export function getAllDocsMetadata(): DocMetadata[] {
  const files = getAllMarkdownFiles();
  return files.map(file => getDocMetadata(file));
}