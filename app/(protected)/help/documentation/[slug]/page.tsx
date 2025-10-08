//app/(protected)/help/documentation/[slug]/page.tsx

import { getMarkdown, extractTableOfContents } from "@/lib/docs";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface DocPageProps {
  params: {
    slug: string;
  };
}

// Mapa slug-ova na stvarne fajlove
const slugToFile: Record<string, string> = {
  'readme': 'README.md',
  'api-docs': 'PROJECT_API_DOCUMENTATION.md',
  'api-structure': 'PROJECT_API_STRUCTURE.md',
  'app-structure': 'PROJECT_STRUCTURE.md',
  'full-docs': 'PROJECT_DOCUMENTATION.md',
  'database': 'baza-podataka.md',
  'architecture': 'arhitektura.md',
};

export function generateStaticParams() {
  return Object.keys(slugToFile).map(slug => ({
    slug,
  }));
}

export default function DocPage({ params }: DocPageProps) {
  const { slug } = params;
  
  // Dohvati ime fajla na osnovu slug-a
  const fileName = slugToFile[slug];
  
  if (!fileName) {
    notFound();
  }
  
  // Učitaj sadržaj
  const content = getMarkdown(fileName);
  const toc = extractTableOfContents(content);
  
  // Izvuci naslov dokumenta
  const title = toc[0]?.text || fileName.replace('.md', '');
  
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
          <h1 className="text-4xl font-bold">{title}</h1>
        </div>
        <p className="text-muted-foreground">
          {fileName}
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
              {/* Previous Doc Link */}
            </div>
            <div>
              {/* Next Doc Link */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}