//app/(protected)/help/documentation/layout.tsx

import { getAllMarkdownFiles } from "@/lib/docs";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FileText, Code, Database, BookOpen, Home } from "lucide-react";

interface DocsLayoutProps {
  children: React.ReactNode;
}

const docSections = [
  {
    title: "Getting Started",
    icon: Home,
    items: [
      { name: "README", slug: "readme", icon: FileText },
      { name: "Architecture", slug: "architecture", icon: BookOpen },
    ]
  },
  {
    title: "API Reference",
    icon: Code,
    items: [
      { name: "API Documentation", slug: "api-docs", icon: FileText },
      { name: "API Structure", slug: "api-structure", icon: Code },
    ]
  },
  {
    title: "Application",
    icon: BookOpen,
    items: [
      { name: "App Structure", slug: "app-structure", icon: FileText },
      { name: "App Contracts structure", slug: "app-contracts", icon: FileText },
      { name: "Full Documentation", slug: "full-docs", icon: BookOpen },
    ]
  },
  {
    title: "Database",
    icon: Database,
    items: [
      { name: "Database Schema", slug: "database", icon: Database },
    ]
  }
];

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r bg-slate-50 dark:bg-slate-900 p-6 sticky top-0 h-screen overflow-y-auto">
        <div className="mb-6">
          <Link href="/help/documentation">
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Docs
            </h2>
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            TRES Documentation
          </p>
        </div>

        <nav className="space-y-6">
          {docSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                <section.icon className="h-4 w-4" />
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/help/documentation/${item.slug}`}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                        "hover:bg-slate-200 dark:hover:bg-slate-800",
                        "text-slate-700 dark:text-slate-300"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Quick Links */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
            Quick Links
          </h3>
          <ul className="space-y-1 text-sm">
            <li>
              <a 
                href="https://nextjs.org/docs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Next.js Docs
              </a>
            </li>
            <li>
              <a 
                href="https://www.prisma.io/docs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Prisma Docs
              </a>
            </li>
            <li>
              <a 
                href="https://ui.shadcn.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                shadcn/ui
              </a>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}