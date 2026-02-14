// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

// middleware.ts
export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  
  console.log("🔍 Middleware called for:", pathname);
  
  const isLoggedIn = !!req.auth?.user?.id;
  const userRole = req.auth?.user?.role;
  const isActive = req.auth?.user?.isActive !== false;
  
  console.log("👤 Session data:", {
    isLoggedIn,
    userId: req.auth?.user?.id,
    role: userRole,
    isActive,
  });
  
  const protectedPaths = [
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
    "/reports",
    "/analytics"
  ];
  
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  
  // Redirect to login if not authenticated
  if (isProtected && !isLoggedIn) {
    console.log("❌ Redirecting to login: not logged in");
    return NextResponse.redirect(new URL("/auth/login", nextUrl.origin));
  }
  
  // Check if user is inactive
  if (isLoggedIn && !isActive) {
    console.log("❌ Redirecting to login: user inactive");
    return NextResponse.redirect(new URL("/auth/login", nextUrl.origin));
  }
  
  // Role-based access control
  if (isLoggedIn) {
    // Admin only paths
    if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
      console.log("❌ Redirecting to 403: not admin");
      return NextResponse.redirect(new URL("/403", nextUrl.origin));
    }
    
    // Analytics - ADMIN and MANAGER only
    if (pathname.startsWith("/analytics")) {
      if (userRole !== "ADMIN" && userRole !== "MANAGER") {
        console.log("❌ Redirecting to 403: insufficient role for analytics");
        return NextResponse.redirect(new URL("/403", nextUrl.origin));
      }
    }
    // ✅ DODAJ - Providers - ADMIN and MANAGER only
  if (pathname.startsWith("/providers")) {
    if (userRole !== "ADMIN" && userRole !== "MANAGER") {
      console.log("❌ Redirecting to 403: insufficient role for providers");
      return NextResponse.redirect(new URL("/403", nextUrl.origin));
    }
  }
    
    // ✅ DODAJ OVO - Reports - ADMIN, MANAGER, and AGENT only
    if (pathname.startsWith("/reports")) {
      if (userRole !== "ADMIN" && userRole !== "MANAGER" && userRole !== "AGENT") {
        console.log("❌ Redirecting to 403: insufficient role for reports");
        return NextResponse.redirect(new URL("/403", nextUrl.origin));
      }
    }
  }
  
  console.log("✅ Access granted to:", pathname);
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api(?!/auth)|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};