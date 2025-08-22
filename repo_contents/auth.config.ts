// auth.config.ts

import bcrypt from "bcryptjs";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { NextAuthConfig, Session } from "next-auth";
import { JWT } from "next-auth/jwt";

import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";

// Add global type extensions
declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    isActive: boolean;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
      isActive: boolean;
      image?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    isActive: boolean;
  }
}

export default {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          role: "USER", // Default role
          isActive: true,
        };
      }
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "USER", // Default role
          isActive: true,
        };
      }
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const user = await getUserByEmail(email);
          if (!user || !user.password) return null;

          const passwordMatch = await bcrypt.compare(password, user.password);

          if (passwordMatch) {
            // Return complete user object
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
              image: user.image,
            };
          }
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 1. Handle initial sign-in
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          isActive: user.isActive,
        };
      }
      
      // 2. Handle session updates
      if (trigger === "update" && session?.user) {
        return { ...token, ...session.user };
      }
      
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // Ensure all required fields are present
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id || "",
          role: token.role || "USER",
          isActive: token.isActive !== undefined ? token.isActive : true,
        }
      };
    },
    async signIn({ user, account, profile }) {
      // Allow social sign-ins without email verification
      if (account?.provider !== "credentials") return true;

      // For credentials, require email verification
      const existingUser = await getUserByEmail(user.email!);
      return !!existingUser?.emailVerified;
    }
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;