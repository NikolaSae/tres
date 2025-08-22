// Path: app/api/test/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Definisimo jednostavnu Zod šemu sa opcionim poljima
const testParamsSchema = z.object({
    // Dva opciona string polja
    param1: z.preprocess(val => (val === null || val === "" ? undefined : val), z.string()).optional(),
    param2: z.preprocess(val => (val === null || val === "" ? undefined : val), z.string()).optional(),

    // Jedno opciono brojčano polje sa default vrednošću (ako je prisutno u URL-u)
    optionalNumber: z.coerce.number().optional().default(0),

    // Jedno opciono boolean polje (true/false)
    isEnabled: z.preprocess(val => {
        if (val === "true") return true;
        if (val === "false") return false;
        return undefined; // Tretiraj sve ostalo kao undefined
    }, z.boolean()).optional(),
});

// GET metoda - samo prima parametre i validira ih
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const params = {
            param1: url.searchParams.get("param1"),
            param2: url.searchParams.get("param2"),
            optionalNumber: url.searchParams.get("optionalNumber"),
            isEnabled: url.searchParams.get("isEnabled"),
        };

        // Pokusaj validacije primljenih parametara
        const validatedParams = await testParamsSchema.parse(params);

        // Ako validacija uspe, vratite uspesan odgovor sa validiranim podacima
        return NextResponse.json({
            status: "success",
            message: "Parameters validated successfully!",
            receivedParams: params, // Prikazi originalno primljene (pre validacije)
            validatedParams: validatedParams, // Prikazi validirane podatke
        }, { status: 200 });

    } catch (error) {
        // Ako validacija ne uspe, vratite 400 sa detaljima Zod greške
        console.error("Test route validation error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    status: "validation_error",
                    message: "Invalid request parameters",
                    details: error.errors,
                },
                { status: 400 }
            );
        }

        // Rukovanje ostalim greškama
        return NextResponse.json(
            {
                status: "server_error",
                message: "An unexpected error occurred.",
            },
            { status: 500 }
        );
    }
}

// Opciono: Dodajte i druge metode ako zelite da testirate POST/PUT/DELETE
// export async function POST(request: NextRequest) { ... }