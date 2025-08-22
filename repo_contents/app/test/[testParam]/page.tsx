// /app/test/[testParam]/page.tsx

import { Metadata } from "next";

interface TestPageProps {
    params: {
        testParam: string; // Dinamički parametar iz URL-a
    };
}

// Async pomoćna (helper) funkcija za "siguran" pristup svojstvu parametra
// Cilj je da se zadovolji "params should be awaited" provera
// uvođenjem eksplicitne async granice pre pristupa svojstvu.
// Iako je `p.testParam` sam po sebi sinhron, `await` na poziv
// funkcije bi mogao da pruži potreban kontekst razrešenja za Next.js 15+.
async function getTestParamValue(p: { testParam: string }): Promise<string> {
    // Pristup svojstvu unutar async helpera
    return p.testParam;
}


// Generisanje metapodataka
export async function generateMetadata(
    { params }: TestPageProps,
): Promise<Metadata> {
    // Koristimo async helper funkciju i await-ujemo njen rezultat
    const paramValue = await getTestParamValue(params);

    return {
        title: `Test Page | Param: ${paramValue}`,
        description: `Testing dynamic param: ${paramValue}`,
    };
}

// Ovo je Server Komponenta
// U Next.js 15+ default export funkcije koje primaju params bi trebalo da budu async
export default async function TestPage({ params }: TestPageProps) { // Označite je kao async

    // Koristimo async helper funkciju i await-ujemo njen rezultat
    const paramValue = await getTestParamValue(params);

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Test Dynamic Param Page</h1>
            <p style={{ fontSize: '16px' }}>
                The dynamic parameter from the URL is: <strong style={{ color: 'blue' }}>{paramValue}</strong>
            </p>
             {/* Opciono: Prikazivanje celog params objekta radi inspekcije */}
             {/* <p style={{ fontSize: '14px', marginTop: '20px' }}>
                  Full params object: {JSON.stringify(params)}
             </p> */}
        </div>
    );
}