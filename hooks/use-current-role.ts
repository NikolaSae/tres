// hooks/use-current-role.ts
import { useSession } from "next-auth/react";
import type { ExtendedUser } from "@/next-auth"; // ili gde god imaš definisan ExtendedUser

export const useCurrentRole = () => {
  const session = useSession();

  return (session.data?.user as ExtendedUser | undefined)?.role;
};