// lib/session.ts

import { auth } from "@/auth"; // OVDE SE PRETPODSTAVLJA DA JE TVOJA AUTH.JS KONFIGURACIJA IZVEZENA IZ FAJLA NA PUTANJI "@/auth"

/**
 * Server-side helper to get the current authenticated user's session.
 * Uses the Auth.js `auth()` helper to retrieve the session data.
 * Returns the user object or null/undefined if no session exists.
 */
export async function getCurrentUser() {
  // Poziv Auth.js `auth()` helpera za dobijanje sesije na server-strani
  // (Ovo je uobičajen način u Next.js App Routeru sa Auth.js v5+)
  const session = await auth();

  // Vraća objekat korisnika iz sesije
  // Ako sesija ne postoji, session će biti null, a session?.user će takođe biti null/undefined
  return session?.user;
}

// Možeš dodati i druge korisne funkcije za sesiju ovde, npr:
// export async function isLoggedIn() {
//   const session = await auth();
//   return !!session?.user; // Vraća true ako je korisnik ulogovan
// }