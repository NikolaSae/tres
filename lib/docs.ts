// lib/docs.ts
import fs from "fs";
import path from "path";

/**
 * Reads and returns the content of a markdown file from the docs directory
 * @param fileName - Name of the markdown file (e.g., "README.md")
 * @returns The content of the markdown file as a string
 * @throws Error if file doesn't exist or can't be read
 */
export function getMarkdown(fileName: string): string {
  try {
    // Pokušaj prvo u docs/docs-site/docs/
    let filePath = path.join(process.cwd(), "docs", "docs-site", "docs", fileName);
    
    if (!fs.existsSync(filePath)) {
      // Fallback na stari docs/ folder
      filePath = path.join(process.cwd(), "docs", fileName);
    }
    
    if (!fs.existsSync(filePath)) {
      console.error(`Markdown file not found: ${filePath}`);
      return '';
    }
    
    const content = fs.readFileSync(filePath, "utf-8");
    console.log(`Successfully loaded: ${fileName} (${content.length} chars)`);
    return content;

  } catch (error) {
    console.error(`Error reading markdown file ${fileName}:`, error);
    return '';
  }
}

/**
 * Represents a table of contents item
 */
export interface TocItem {
  text: string;
  level: number;
  id: string;
}

/**
 * Extracts table of contents from markdown content
 * @param markdown - Markdown content as string
 * @returns Array of TocItem objects representing the document structure
 */
export function extractTableOfContents(markdown: string): TocItem[] {
  if (!markdown || markdown.trim().length === 0) {
    console.warn('Empty markdown provided to extractTableOfContents');
    return [];
  }

  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const toc: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    
    // Remove markdown formatting from heading text
    const cleanText = text
      .replace(/\*\*/g, '') // Remove bold
      .replace(/\*/g, '')   // Remove italic
      .replace(/`/g, '')    // Remove code
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links but keep text
      .replace(/[📋🎯📂⚙️📝🏢⏳🔍✏️🧠🧱🔐🧭📘🔧🗂️📊🔄🔒📧🧪👥📚]/g, ''); // Remove emojis
    
    // Create URL-friendly ID from heading text
    const id = cleanText
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '')  // Trim hyphens from start/end
      .trim();

    if (id) { // Only add if we have a valid ID
      toc.push({
        text: cleanText.trim(),
        level,
        id,
      });
    }
  }

  console.log(`Extracted ${toc.length} headings from markdown`);
  return toc;
}

/**
 * Gets all markdown files from the docs directory
 * @returns Array of markdown file names
 */
export function getAllMarkdownFiles(): string[] {
  const docsDirectory = path.join(process.cwd(), "docs");
  
  try {
    // Check if docs directory exists
    if (!fs.existsSync(docsDirectory)) {
      console.error(`Docs directory not found: ${docsDirectory}`);
      fs.mkdirSync(docsDirectory, { recursive: true });
      console.log(`Created docs directory: ${docsDirectory}`);
      return [];
    }

    const files = fs.readdirSync(docsDirectory);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    console.log(`Found ${mdFiles.length} markdown files in docs directory`);
    return mdFiles;
  } catch (error) {
    console.error("Error reading docs directory:", error);
    return [];
  }
}

/**
 * Metadata for a documentation file
 */
export interface DocMetadata {
  fileName: string;
  title: string;
  slug: string;
  description?: string;
  category?: string;
}

/**
 * Extracts metadata from a markdown file
 * @param fileName - Name of the markdown file
 * @returns DocMetadata object
 */
export function getDocMetadata(fileName: string): DocMetadata {
  const content = getMarkdown(fileName);
  
  if (!content) {
    return {
      fileName,
      title: fileName.replace('.md', ''),
      slug: fileName.replace('.md', '').toLowerCase().replace(/_/g, '-'),
    };
  }

  const toc = extractTableOfContents(content);
  
  // Extract title from first heading or filename
  const title = toc.find(item => item.level === 1)?.text || 
                fileName.replace('.md', '').replace(/-/g, ' ');
  
  // Create slug from filename
  const slug = fileName
    .replace('.md', '')
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-');

  // Try to extract description from content (first paragraph after title)
  let description: string | undefined;
  const lines = content.split('\n');
  const titleIndex = lines.findIndex(line => line.trim().startsWith('# '));
  
  if (titleIndex !== -1) {
    // Find first non-empty line after title
    for (let i = titleIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && !line.startsWith('---') && !line.startsWith('>')) {
        description = line
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/[📋🎯📂⚙️📝🏢⏳🔍✏️🧠🧱🔐🧭📘🔧🗂️📊🔄🔒📧🧪👥📚]/g, '')
          .substring(0, 150);
        if (description.length === 150) description += '...';
        break;
      }
    }
  }

  // Determine category based on filename or content
  let category: string | undefined;
  const lowerFileName = fileName.toLowerCase();
  
  if (lowerFileName.includes('api')) {
    category = 'API Reference';
  } else if (lowerFileName.includes('project_structure') || lowerFileName.includes('app_structure')) {
    category = 'Application';
  } else if (lowerFileName.includes('baza') || lowerFileName.includes('database')) {
    category = 'Database';
  } else if (lowerFileName.includes('arhitektura') || lowerFileName.includes('architecture')) {
    category = 'Architecture';
  } else if (lowerFileName.includes('project_app_') || lowerFileName.includes('contracts') || lowerFileName.includes('module')) {
    category = 'Application Modules';
  } else if (fileName === 'README.md') {
    category = 'Getting Started';
  }

  return {
    fileName,
    title,
    slug,
    description,
    category,
  };
}

/**
 * Gets metadata for all markdown files in docs directory
 * @returns Array of DocMetadata objects
 */
export function getAllDocsMetadata(): DocMetadata[] {
  const files = getAllMarkdownFiles();
  const metadata = files.map(file => getDocMetadata(file));
  
  // Sort by category and title
  metadata.sort((a, b) => {
    if (a.category && b.category && a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.title.localeCompare(b.title);
  });
  
  return metadata;
}

/**
 * Searches through all markdown files for a query string
 * @param query - Search query
 * @returns Array of search results with file metadata and matched content
 */
export function searchDocs(query: string): Array<DocMetadata & { matches: string[] }> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const files = getAllMarkdownFiles();
  const results: Array<DocMetadata & { matches: string[] }> = [];
  const searchTerm = query.toLowerCase();

  for (const file of files) {
    const content = getMarkdown(file);
    const metadata = getDocMetadata(file);
    const matches: string[] = [];

    // Check if title matches
    if (metadata.title.toLowerCase().includes(searchTerm)) {
      matches.push(`Title: ${metadata.title}`);
    }

    // Search in content
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.toLowerCase().includes(searchTerm)) {
        // Get context (line before and after)
        const context = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2)).join(' ');
        const cleanContext = context
          .replace(/[#*`]/g, '')
          .substring(0, 200);
        matches.push(cleanContext + '...');
        
        if (matches.length >= 3) break; // Limit matches per file
      }
    }

    if (matches.length > 0) {
      results.push({
        ...metadata,
        matches,
      });
    }
  }

  console.log(`Search for "${query}" returned ${results.length} results`);
  return results;
}

/**
 * Validates that all required documentation files exist
 * @returns Object with validation results
 */
export function validateDocs(): {
  valid: boolean;
  missing: string[];
  found: string[];
} {
  const requiredFiles = [
    'README.md',
    'arhitektura.md',
    'baza-podataka.md',
    'PROJECT_API_DOCUMENTATION.md',
    'PROJECT_STRUCTURE.md',
    'PROJECT_APP_CONTRACTS.md', // ✅ Dodato
  ];

  const existingFiles = getAllMarkdownFiles();
  const missing = requiredFiles.filter(file => !existingFiles.includes(file));

  const result = {
    valid: missing.length === 0,
    missing,
    found: existingFiles,
  };

  if (result.valid) {
    console.log('✅ All required documentation files are present');
  } else {
    console.warn(`⚠️ Missing documentation files: ${missing.join(', ')}`);
  }

  return result;
}

/**
 * Gets documentation statistics
 * @returns Object with documentation statistics
 */
export function getDocsStats() {
  const files = getAllMarkdownFiles();
  const metadata = getAllDocsMetadata();
  
  const stats = {
    totalFiles: files.length,
    categories: {} as Record<string, number>,
    totalSize: 0,
    averageSize: 0,
  };

  // Count by category
  metadata.forEach(doc => {
    if (doc.category) {
      stats.categories[doc.category] = (stats.categories[doc.category] || 0) + 1;
    }
  });

  // Calculate total size
  files.forEach(file => {
    const content = getMarkdown(file);
    stats.totalSize += content.length;
  });

  stats.averageSize = Math.round(stats.totalSize / files.length);

  return stats;
}