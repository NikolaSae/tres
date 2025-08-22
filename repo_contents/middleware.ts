// middleware.ts - FIXED VERSION
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  
  console.log(`🔍 Middleware called for: ${pathname}`);
  
  // Get user info from auth
  const isLoggedIn = !!req.auth?.user?.id;
  const isAdmin = req.auth?.user?.role === "ADMIN";
  const isActive = req.auth?.user?.isActive !== false;
  const image = req.auth?.user?.image;

  console.log(`👤 Session data:`, {
    isLoggedIn,
    userId: req.auth?.user?.id,
    role: req.auth?.user?.role,
    isActive: req.auth?.user?.isActive,
    image: req.auth?.user?.image,

  });

  const protectedPaths = ["/admin", "/dashboard", "/operators", "/providers", "/complaints", "/parking-services", "/bulk-services", "/contracts", "/services", "/humanitarian-orgs", "/reports" ];
  const adminOnlyPaths = ["/admin"];

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAdminOnly = adminOnlyPaths.some((p) => pathname.startsWith(p));

  console.log(`🛡️ Path checks:`, {
    isProtected,
    isAdminOnly,
    pathname
  });

  // Check if user is not logged in and trying to access protected path
  if (isProtected && !isLoggedIn) {
    console.log(`❌ Redirecting to login: not logged in`);
    return NextResponse.redirect(new URL("/auth/login", nextUrl.origin));
  }

  // Check if user is inactive
  if (isLoggedIn && !isActive) {
    console.log(`❌ Redirecting to login: user inactive`);
    return NextResponse.redirect(new URL("/auth/login", nextUrl.origin));
  }

  // Check admin access
  if (isAdminOnly && isLoggedIn && !isAdmin) {
    console.log(`❌ Redirecting to 403: not admin`);
    return NextResponse.redirect(new URL("/403", nextUrl.origin));
  }

  console.log(`✅ Access granted to: ${pathname}`);
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and API routes (except auth)
    '/((?!api(?!/auth)|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};