///lib/auth/adapters/listAuthenticatorsByUserId.ts


import { Awaitable } from "next-auth";
import { AdapterAuthenticator } from "next-auth/adapters";
import { db } from "@/lib/db";

/**
 * Lists all authenticators for a given user
 * @param userId The user ID to retrieve authenticators for
 * @returns An array of authenticators associated with the user
 */
export async function listAuthenticatorsByUserId(userId: string): Awaitable<AdapterAuthenticator[]> {
  try {
    const authenticators = await db.authenticator.findMany({
      where: {
        userId: userId
      }
    });
    
    return authenticators.map(auth => ({
      id: auth.id,
      userId: auth.userId,
      credentialID: auth.credentialID,
      providerAccountId: auth.providerAccountId,
      credentialPublicKey: auth.credentialPublicKey,
      counter: auth.counter,
      credentialDeviceType: auth.credentialDeviceType,
      credentialBackedUp: auth.credentialBackedUp,
      transports: auth.transports,
    }));
  } catch (error) {
    console.error("Error listing authenticators for user:", error);
    throw new Error(`Failed to retrieve authenticators for user ${userId}`);
  }
}