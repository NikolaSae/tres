// app/(protected)/help/documentation/[slug]/page.tsx
import { getMarkdown, extractTableOfContents } from "@/lib/docs";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface DocPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Mapa slug-ova na stvarne fajlove
const slugToFile: Record<string, string> = {
  'readme': 'intro.md',
  'api-docs': 'architecture/api-routes.md',
  'api-structure': 'architecture/api-routes.md',
  'app-structure': 'architecture/folder-structure.md',
  'full-docs': 'intro.md',
  'database': 'architecture/database.md',
  'architecture': 'architecture/overview.md',
  'contracts-module': 'features/contracts.md',
};

// Mapa naslova i opisa za svaki dokument
const docInfo: Record<string, { title: string; description: string; category: string }> = {
  'readme': {
    title: 'README',
    description: 'Project overview, setup instructions, and quick start guide',
    category: 'Getting Started'
  },
  'architecture': {
    title: 'System Architecture',
    description: 'Detailed system architecture and design patterns',
    category: 'Architecture'
  },
  'api-docs': {
    title: 'API Documentation',
    description: 'Complete API endpoints reference with examples',
    category: 'API Reference'
  },
  'api-structure': {
    title: 'API Structure',
    description: 'API organization and routing structure',
    category: 'API Reference'
  },
  'app-structure': {
    title: 'Application Structure',
    description: 'Project structure and file organization',
    category: 'Application'
  },
  'full-docs': {
    title: 'Full Documentation',
    description: 'Comprehensive project documentation',
    category: 'Application'
  },
  'database': {
    title: 'Database Schema',
    description: 'Complete database schema with relationships',
    category: 'Database'
  },
  'contracts-module': {
    title: 'Contracts Module',
    description: 'Documentation for the contracts management module',
    category: 'Application'
  },
};

export async function generateStaticParams() {
  return Object.keys(slugToFile).map(slug => ({
    slug,
  }));
}

export async function generateMetadata({ params }: DocPageProps) {
  const { slug } = await params;
  const info = docInfo[slug];
  
  return {
    title: info ? `${info.title} | TRES Documentation` : 'Documentation | TRES',
    description: info?.description || 'TRES System Documentation',
  };
}

export default async function DocPage({ params }: DocPageProps) {
  // ✅ Await params (Next.js 15 requirement)
  const { slug } = await params;
  
  // Dohvati ime fajla na osnovu slug-a
  const fileName = slugToFile[slug];
  
  if (!fileName) {
    console.error(`No file mapping found for slug: ${slug}`);
    notFound();
  }
  
  // Učitaj sadržaj
  const content = getMarkdown(fileName);
  
  if (!content || content.trim().length === 0) {
    console.error(`Empty or missing content for file: ${fileName}`);
    return <FileNotFoundError fileName={fileName} slug={slug} />;
  }
  
  const toc = extractTableOfContents(content);
  
  // Koristi predefinisane info ili fallback
  const info = docInfo[slug] || {
    title: fileName.replace('.md', '').replace(/-/g, ' '),
    description: `Documentation for ${fileName}`,
    category: 'Documentation'
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
        <div className="flex items-start gap-4 mb-2">
          <FileText className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground">{info.category}</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">{info.title}</h1>
            <p className="text-muted-foreground text-lg">
              {info.description}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table of Contents - Sidebar */}
        {toc.length > 0 && (
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card>
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
                        className={`block text-sm hover:text-primary hover:bg-muted/50 rounded px-2 py-1 transition-colors ${
                          heading.level === 1 ? 'font-semibold' : ''
                        } ${heading.level === 2 ? 'text-muted-foreground' : ''}`}
                        style={{ paddingLeft: `${(heading.level - 1) * 0.75 + 0.5}rem` }}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={toc.length > 0 ? "lg:col-span-3" : "lg:col-span-4"}>
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <MarkdownViewer content={content} />
              </div>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="mt-8 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Source File:</span> {fileName}
              </div>
              <div>
                <Link 
                  href="/help/documentation"
                  className="text-primary hover:underline"
                >
                  View all documentation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error component for missing files
function FileNotFoundError({ fileName, slug }: { fileName: string; slug: string }) {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/help/documentation">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Documentation
          </Button>
        </Link>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Documentation Not Found</CardTitle>
              <CardDescription>
                The requested documentation file could not be loaded
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Requested slug:</span> <code>{slug}</code>
              </p>
              <p className="text-sm mt-1">
                <span className="font-medium">Expected file:</span> <code>docs/{fileName}</code>
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Possible reasons:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>The documentation file doesn't exist in the <code>docs/</code> directory</li>
                <li>The file path or name is incorrect</li>
                <li>File permissions issue</li>
                <li>The file is empty</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">What you can do:</p>
              <div className="flex gap-2">
                <Link href="/help/documentation">
                  <Button variant="default" size="sm">
                    Browse Documentation
                  </Button>
                </Link>
                <Link href="/help">
                  <Button variant="outline" size="sm">
                    Go to Help Center
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}