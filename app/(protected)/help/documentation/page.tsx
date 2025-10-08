//app/(protected)/help/documentation/page.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Code, Database, Zap, Shield, Server, Layers } from "lucide-react";
import Link from "next/link";

export default function DocumentationPage() {
  
  // Documentation categories with their associated files
  const docCategories = [
    {
      title: "Getting Started",
      description: "Essential documentation to get you started with TRES",
      icon: Zap,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
      docs: [
        {
          name: "README",
          slug: "readme",
          description: "Project overview, setup instructions, and quick start guide",
          icon: FileText,
        },
        {
          name: "Architecture",
          slug: "architecture",
          description: "System architecture and design patterns",
          icon: Layers,
        },
      ]
    },
    {
      title: "API Reference",
      description: "Complete API documentation and structure",
      icon: Code,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      docs: [
        {
          name: "API Documentation",
          slug: "api-docs",
          description: "Complete API endpoints reference with examples",
          icon: FileText,
        },
        {
          name: "API Structure",
          slug: "api-structure",
          description: "API organization and routing structure",
          icon: Code,
        },
      ]
    },
    {
      title: "Application",
      description: "Application structure and detailed documentation",
      icon: Server,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
      docs: [
        {
          name: "App Structure",
          slug: "app-structure",
          description: "Project structure and file organization",
          icon: FileText,
        },
        {
          name: "App Contracts structure",
          slug: "app-contracts",
          description: "Project structure and file organization",
          icon: FileText,
        },
        {
          name: "Full Documentation",
          slug: "full-docs",
          description: "Comprehensive project documentation",
          icon: BookOpen,
        },
      ]
    },
    {
      title: "Database",
      description: "Database schema and data models",
      icon: Database,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      docs: [
        {
          name: "Database Schema",
          slug: "database",
          description: "Complete database schema with relationships",
          icon: Database,
        },
      ]
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">
              TRES Documentation
            </h1>
            <p className="text-muted-foreground text-lg">
              Comprehensive documentation for Telco Regulation & Expense System
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Zap className="h-8 w-8 text-yellow-500" />
              <span className="text-3xl font-bold">2</span>
            </div>
            <CardTitle className="text-sm font-medium">Getting Started</CardTitle>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Code className="h-8 w-8 text-blue-500" />
              <span className="text-3xl font-bold">2</span>
            </div>
            <CardTitle className="text-sm font-medium">API Docs</CardTitle>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Server className="h-8 w-8 text-green-500" />
              <span className="text-3xl font-bold">2</span>
            </div>
            <CardTitle className="text-sm font-medium">Application</CardTitle>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Database className="h-8 w-8 text-purple-500" />
              <span className="text-3xl font-bold">1</span>
            </div>
            <CardTitle className="text-sm font-medium">Database</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Documentation Categories */}
      <div className="space-y-12">
        {docCategories.map((category, idx) => (
          <div key={idx}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${category.bgColor}`}>
                <category.icon className={`h-6 w-6 ${category.color}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{category.title}</h2>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.docs.map((doc) => (
                <Link key={doc.slug} href={`/help/documentation/${doc.slug}`}>
                  <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                          <doc.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {doc.name}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {doc.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Additional Resources */}
      <div className="mt-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            <Shield className="h-6 w-6 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Additional Resources</h2>
            <p className="text-muted-foreground">External documentation and references</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="https://nextjs.org/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Next.js Documentation
                  <span className="text-xs text-muted-foreground">↗</span>
                </CardTitle>
                <CardDescription>
                  Official Next.js framework documentation
                </CardDescription>
              </CardHeader>
            </Card>
          </a>

          <a 
            href="https://www.prisma.io/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Prisma Documentation
                  <span className="text-xs text-muted-foreground">↗</span>
                </CardTitle>
                <CardDescription>
                  Prisma ORM documentation and guides
                </CardDescription>
              </CardHeader>
            </Card>
          </a>

          <a 
            href="https://ui.shadcn.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  shadcn/ui
                  <span className="text-xs text-muted-foreground">↗</span>
                </CardTitle>
                <CardDescription>
                  UI component library documentation
                </CardDescription>
              </CardHeader>
            </Card>
          </a>
        </div>
      </div>

      {/* Help Section */}
      <Card className="mt-12 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Need Help?
          </CardTitle>
          <CardDescription>
            Can't find what you're looking for? Check out these resources or contact the development team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href="/help">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Help Center
              </button>
            </Link>
            <Link href="/help/faq">
              <button className="px-4 py-2 border rounded-md hover:bg-muted transition-colors">
                FAQ
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}