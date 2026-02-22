// proxy.ts
// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/error",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/new-password",
  "/auth/new-verification",
  "/auth/reset",
  "/403",
  "/404",
];

const PROTECTED_PATHS = [
  "/admin",
  "/dashboard",
  "/operators",
  "/providers",
  "/complaints",
  "/parking-services",
  "/bulk-services",
  "/contracts",
  "/services",
  "/humanitarian-orgs",
  "/humanitarian-renewals",
  "/reports",
  "/analytics",
  "/audit-logs",
  "/notifications",
  "/profile",
  "/settings",
  "/chat",
  "/products",
  "/help",
];

function validateCSRF(request: NextRequest): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function isCronAuthorized(request: NextRequest): boolean {
  return request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

// ✅ ISPRAVKA: named export "proxy" umesto "middleware"
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cron endpointi
  if (pathname.startsWith("/api/cron")) {
    if (!isCronAuthorized(request)) {
      return NextResponse.json({ error: "Neovlašćen pristup" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // NextAuth rute — slobodne
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // CSRF zaštita za ostale API rute
  if (pathname.startsWith("/api")) {
    if (!validateCSRF(request)) {
      return NextResponse.json({ error: "CSRF validacija nije prošla" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // Javne stranice
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Zaštićene stranice — proveri cookie
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const sessionCookie =
      request.cookies.get("authjs.session-token") ||
      request.cookies.get("__Secure-authjs.session-token") ||
      request.cookies.get("next-auth.session-token");

    if (!sessionCookie) {
      const callbackUrl = encodeURIComponent(pathname + request.nextUrl.search);
      return NextResponse.redirect(
        new URL(`/auth/login?callbackUrl=${callbackUrl}`, request.url)
      );
    }
  }

  // Security headers
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};