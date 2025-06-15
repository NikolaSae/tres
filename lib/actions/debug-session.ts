// Debug session server action - Path: /lib/actions/debug-session.ts
import { auth } from "@/auth";

export async function debugServerSession() {
  "use server";
  
  const session = await auth();
  
  console.log("[SERVER_SESSION] ===== DEBUG =====");
  console.log("[SERVER_SESSION] Session exists:", !!session);
  console.log("[SERVER_SESSION] User:", session?.user);
  console.log("[SERVER_SESSION] Expires:", session?.expires);
  console.log("[SERVER_SESSION] =================");
  
  return {
    hasSession: !!session,
    user: session?.user || null,
    expires: session?.expires || null
  };
}