//lib/auth.ts
import { auth } from "@/auth";

export const currentUser = async () => {
  const session = await auth();

  return session?.user;
};
export async function getCurrentUser() {
    // Replace with your logic to get the current authenticated user
    const session = await auth(); // Example for NextAuth v5
    return session?.user;
}

export const currentRole = async () => {
  const session = await auth();

  return session?.user.role;
};
