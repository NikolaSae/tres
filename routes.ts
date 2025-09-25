// routes.ts - FIXED VERSION

/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes = [
  "/", // Home page
  "/auth/new-verification"
  // REMOVED "/dashboard/" - dashboard should be protected!
];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /complaints
 * @type {string[]}
 */
export const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/error",
  "/auth/reset",
  "/auth/new-password",
];

/**
 * Rute koje su dostupne samo korisnicima sa admin ulogom
 * @type {string[]}
 */
export const adminRoutes = [
  "/admin",
  "/complaints/admin",
  "/operators/new", // Dodano
  "/providers/new", // Dodano ako postoji
  "/services/new",  // Dodano ako postoji
];

/**
 * Rute koje su dostupne samo autentifikovanim korisnicima
 * @type {string[]}
 */
export const protectedRoutes = [
  "/settings",
  "/server",
  "/client",
  "/admin",
  "/dashboard", // Dodano (bez trailing slash!)
  "/complaints",
  "/complaints/new",
  "/complaints/admin",
  "/admin/complaints",
  "/operators", // DODANO
  "/operators/new", // DODANO
  "/operators/[id]", // DODANO
  "/operators/[id]/edit", // DODANO
  "/contracts", // DODANO
  "/contracts/new", // DODANO
  "/contracts/[id]", // DODANO
  "/contracts/[id]/edit", // DODANO
  "/providers", // DODANO ako postoji
  "/services", // DODANO ako postoji
];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * The default redirect path after logging in
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/complaints";

// DODANO: Helper funkcije za lakše upravljanje rutama
export const isPublicRoute = (pathname: string): boolean => {
  return publicRoutes.includes(pathname);
};

export const isAuthRoute = (pathname: string): boolean => {
  return authRoutes.includes(pathname);
};

export const isProtectedRoute = (pathname: string): boolean => {
  return protectedRoutes.some(route => {
    if (route.includes('[')) {
      // Handle dynamic routes like /operators/[id]
      const pattern = route.replace(/\[.*?\]/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });
};

export const isAdminRoute = (pathname: string): boolean => {
  return adminRoutes.some(route => pathname.startsWith(route));
};