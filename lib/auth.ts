// lib/auth.ts

// Re-export auth so other files can use it directly
export { auth } from "@/auth";

export const currentUser = async () => {
  const session = await auth();
  return session?.user;
};

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export const currentRole = async () => {
  const session = await auth();
  return session?.user?.role;
};