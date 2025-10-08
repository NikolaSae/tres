//app/components/docs/DocsSearch.tsx

'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';

interface SearchResult {
  title: string;
  slug: string;
  preview: string;
  matches: number;
}

export function DocsSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search logic
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    // Simulate search (in real app, this would call an API)
    const mockSearch = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));

      const mockResults: SearchResult[] = [
        {
          title: 'Project Architecture',
          slug: 'readme',
          preview: 'Next.js 14 with App Router, React 18, Tailwind CSS, and shadcn/ui components...',
          matches: 3
        },
        {
          title: 'API Routes',
          slug: 'api-docs',
          preview: 'Complete API documentation for all endpoints including authentication, contracts...',
          matches: 5
        },
        {
          title: 'Database Schema',
          slug: 'database',
          preview: 'PostgreSQL database with Prisma ORM. Core entities include User, Provider, Contract...',
          matches: 2
        }
      ].filter(result => 
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.preview.toLowerCase().includes(query.toLowerCase())
      );

      setResults(mockResults);
      setLoading(false);
    };

    mockSearch();
  }, [query]);

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search documentation...
        <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Search Documentation</DialogTitle>
            <DialogDescription>
              Search through all documentation pages
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Type to search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10"
                autoFocus
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                  onClick={() => setQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto border-t px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((result, index) => (
                  <Link
                    key={index}
                    href={`/help/documentation/${result.slug}`}
                    onClick={() => {
                      setOpen(false);
                      setQuery('');
                    }}
                    className="block rounded-lg border p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1">
                          {result.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.preview}
                        </p>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {result.matches} {result.matches === 1 ? 'match' : 'matches'}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Search className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-1">Try different keywords</p>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Search className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>Start typing to search</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}