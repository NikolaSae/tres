// app/(protected)/help/documentation/[slug]/page.tsx
import { getMarkdown, extractTableOfContents } from "@/lib/docs";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface DocPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Mapa slug-ova na stvarne fajlove
const slugToFile: Record<string, string> = {
  'readme': 'README.md',
  'api-docs': 'PROJECT_API_DOCUMENTATION.md',
  'api-structure': 'PROJECT_API_STRUCTURE.md',
  'app-structure': 'PROJECT_STRUCTURE.md',
  'app-contracts': 'PROJECT_APP_CONTRACTS.md',
  'full-docs': 'PROJECT_DOCUMENTATION.md',
  'database': 'baza-podataka.md',
  'architecture': 'arhitektura.md',
};

// Mapa naslova za svaki dokument
const docTitles: Record<string, { title: string; description: string }> = {
  'readme': { 
    title: 'README', 
    description: 'Project overview, setup instructions, and quick start guide' 
  },
  'api-docs': { 
    title: 'API Documentation', 
    description: 'Complete API endpoints reference with examples' 
  },
  'api-structure': { 
    title: 'API Structure', 
    description: 'API organization and routing structure' 
  },
  'app-structure': { 
    title: 'App Structure', 
    description: 'Project structure and file organization' 
  },
  'app-structure': { 
    title: 'App Contracts structure', 
    description: 'Project contracts structure and file organization' 
  },
  'full-docs': { 
    title: 'Full Documentation', 
    description: 'Comprehensive project documentation' 
  },
  'database': { 
    title: 'Database Schema', 
    description: 'Complete database schema with relationships' 
  },
  'architecture': { 
    title: 'Architecture', 
    description: 'System architecture and design patterns' 
  },
};

export async function generateStaticParams() {
  return Object.keys(slugToFile).map(slug => ({
    slug,
  }));
}

export default async function DocPage({ params }: DocPageProps) {
  // ✅ Await params
  const { slug } = await params;
  
  // Dohvati ime fajla na osnovu slug-a
  const fileName = slugToFile[slug];
  
  if (!fileName) {
    notFound();
  }
  
  // Učitaj sadržaj
  const content = getMarkdown(fileName);
  
  if (!content) {
    notFound();
  }
  
  const toc = extractTableOfContents(content);
  
  // Koristi predefinisane naslove ili fallback
  const docInfo = docTitles[slug] || { 
    title: fileName.replace('.md', ''), 
    description: fileName 
  };
  
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/help/documentation">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Documentation
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">{docInfo.title}</h1>
        </div>
        <p className="text-muted-foreground">
          {docInfo.description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table of Contents - Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Table of Contents</CardTitle>
              <CardDescription>Quick navigation</CardDescription>
            </CardHeader>
            <CardContent>
              {toc.length > 0 ? (
                <nav className="space-y-1">
                  {toc.map((heading, index) => (
                    <a
                      key={index}
                      href={`#${heading.id}`}
                      className={`block text-sm hover:text-primary transition-colors ${
                        heading.level === 1 ? 'font-semibold' : ''
                      }`}
                      style={{ paddingLeft: `${(heading.level - 1) * 0.75}rem` }}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              ) : (
                <p className="text-sm text-muted-foreground">No headings found</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-6">
              <MarkdownViewer content={content} />
            </CardContent>
          </Card>

          {/* Footer Navigation */}
          <div className="mt-8 flex justify-between">
            <div>
              {/* Previous Doc Link - možeš dodati navigaciju */}
            </div>
            <div>
              {/* Next Doc Link - možeš dodati navigaciju */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}