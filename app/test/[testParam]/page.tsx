// app/test/[testParam]/page.tsx

import { Metadata } from "next";

// ────────────────────────────────────────────────
// Props tip sada očekuje Promise (obavezno za Next.js 15+)
interface TestPageProps {
  params: Promise<{ testParam: string }>;
}

// Generisanje metapodataka – async + await params
export async function generateMetadata(
  { params }: TestPageProps,
): Promise<Metadata> {
  const { testParam } = await params;   // ← await ovde

  return {
    title: `Test Page | Param: ${testParam}`,
    description: `Testing dynamic param: ${testParam}`,
  };
}

// Default export – takođe async + await params
export default async function TestPage({ params }: TestPageProps) {
  const { testParam } = await params;   // ← await ovde

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>
        Test Dynamic Param Page
      </h1>
      <p style={{ fontSize: '16px' }}>
        The dynamic parameter from the URL is:{' '}
        <strong style={{ color: 'blue' }}>{testParam}</strong>
      </p>

      {/* Opciono – za debag */}
      {/* <p style={{ fontSize: '14px', marginTop: '20px' }}>
        Raw awaited params: {JSON.stringify({ testParam })}
      </p> */}
    </div>
  );
}