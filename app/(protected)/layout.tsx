// app/(protected)/layout.tsx
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { Navbar } from "./_components/navbar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeProvider } from "@/contexts/theme-context";
import { themeScript } from "@/utils/theme-script";
import Script from "next/script";
import React from 'react';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const session = await auth();
  
  return (
    <>
      {/* Inline theme script for immediate execution */}
      <Script
        id="theme-script"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: themeScript }}
      />
      
      <ThemeProvider>
        <SessionProvider session={session}>
          <div className="min-h-screen flex flex-col bg-background text-foreground theme-transition">
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border supports-[backdrop-filter]:bg-background/60">
              <Navbar />
            </header>
            
            <main className="flex-1 container mx-auto px-4 py-6">
              {children}
            </main>
            
            <footer className="border-t border-border bg-muted/30">
              <div className="container mx-auto px-4 py-4">
                <div className="flex justify-center">
                  <ThemeToggle />
                </div>
              </div>
            </footer>
          </div>
        </SessionProvider>
      </ThemeProvider>
    </>
  );
}