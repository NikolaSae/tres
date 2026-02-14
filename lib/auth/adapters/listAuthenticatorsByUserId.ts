///lib/auth/adapters/listAuthenticatorsByUserId.ts

import { AdapterAuthenticator } from "next-auth/adapters";

/**
 * Lists all authenticators for a given user
 * Currently returns empty array - WebAuthn/Passkeys not implemented
 * @param userId The user ID to retrieve authenticators for
 * @returns An empty array (authenticators not implemented)
 */
export async function listAuthenticatorsByUserId(userId: string): Promise<AdapterAuthenticator[]> {
  // ✅ Return empty array - WebAuthn/Passkeys not implemented yet
  return [];
  
  // TODO: Implement when Authenticator model is added to schema.prisma
  // and WebAuthn/Passkeys functionality is needed
}