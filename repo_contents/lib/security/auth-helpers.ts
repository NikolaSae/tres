// Path: lib/security/auth-helpers.ts

// Import the auth function from your NextAuth.js configuration file
import { auth } from "@/auth"; // Assuming "@/auth" is the path to your NextAuth config exporting 'auth'
import { UserRole } from "@prisma/client"; // Assuming UserRole enum is imported from Prisma client

/**
 * Fetches the current authenticated user from the session.
 * @returns A promise resolving to the user object or undefined if not authenticated.
 */
export async function getCurrentUser() {
    // Use the auth() function to get the session
    const session = await auth();
    // Return the user object from the session
    return session?.user;
}

/**
 * Checks if the current user has any of the required roles.
 * @param requiredRoles - An array of UserRole enums.
 * @returns A promise resolving to true if the user has one of the roles, false otherwise.
 */
export async function hasRequiredRole(requiredRoles: UserRole[]) {
    const user = await getCurrentUser();
    // Check if user exists and has a role, then check if their role is in the requiredRoles array
    if (!user || !user.role) return false;
    return requiredRoles.includes(user.role as UserRole); // Cast user.role to UserRole for type safety
}

/**
 * Checks if the current user is an Admin.
 * @returns A promise resolving to true if the user is an Admin, false otherwise.
 */
export async function isAdmin() {
    return hasRequiredRole([UserRole.ADMIN]);
}

/**
 * Checks if the current user is a Manager or Admin.
 * @returns A promise resolving to true if the user is a Manager or Admin, false otherwise.
 */
export async function isManagerOrAbove() {
    return hasRequiredRole([UserRole.ADMIN, UserRole.MANAGER]);
}

/**
 * Checks if the current user is an Agent, Manager, or Admin.
 * @returns A promise resolving to true if the user is an Agent, Manager, or Admin, false otherwise.
 */
export async function isAgentOrAbove() {
    return hasRequiredRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT]);
}

// You might also need a way to get the full session object itself in some cases
// If needed, uncomment and export this function:
// import { Session } from "next-auth"; // Import Session type if needed
// /**
//  * Fetches the current authentication session.
//  * @returns A promise resolving to the session object or null if not authenticated.
//  */
// export async function getSession(): Promise<Session | null> {
//      return auth();
// }
	