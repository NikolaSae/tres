//lib/server-path-utils.ts

import 'server-only';

/**
 * Server-only utility za konstruisanje path-ova.
 * Ova funkcija je wrapper oko path.join() koji sakriva
 * path konstrukciju od Turbopack static analysis-a.
 */
export async function buildReportPath(...segments: string[]): Promise<string> {
  const path = await import('path');
  return path.join(...segments);
}

/**
 * Helper za public/reports base path
 */
export async function getReportsBasePath(): Promise<string> {
  const path = await import('path');
  return path.join(process.cwd(), 'public', 'reports');
}