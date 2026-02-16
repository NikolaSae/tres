// app/layout.tsx - Optimizovana verzija
import type { Metadata } from "next";
import localFont from "next/font/local";
import React from 'react';
import { themeScript } from "@/utils/theme-script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap", // ✅ Optimizacija za font loading
  preload: true,
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Fin-App-Hub",
    template: "%s | Fin-App-Hub", // ✅ Template za sve stranice
  },
  description: "Finansijski izveštaji, vaši servisi, reklamacije, parking i još mnogo toga.",
  keywords: ["finansije", "izveštaji", "reklamacije", "parking"], // ✅ SEO
  authors: [{ name: "Fin-App-Hub Team" }],
  creator: "Fin-App-Hub",
  openGraph: {
    type: "website",
    locale: "sr_RS",
    url: "https://your-domain.com",
    title: "Fin-App-Hub",
    description: "Finansijski izveštaji, vaši servisi, reklamacije, parking i još mnogo toga.",
    siteName: "Fin-App-Hub",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}