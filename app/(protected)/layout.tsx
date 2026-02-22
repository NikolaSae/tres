// app/(protected)/layout.tsx
import { Navbar } from "./_components/navbar";
import { ThemeToggle } from "@/components/theme-toggle";
import { SessionWrapper } from "./_components/SessionWrapper";
import { FloatingChatButton } from "./_components/floating-chat-button";
import React from "react";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <SessionWrapper>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
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
        <FloatingChatButton />
      </div>
    </SessionWrapper>
  );
}