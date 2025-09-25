// auth.ts - Unified authentication configuration

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/schemas/auth";
import type { NextAuthConfig } from "next-auth";

// Type extensions
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
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    isActive: boolean;
  }
}

const config: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isActive = user.isActive;
      }

      // Fetch user data if missing
      if (token.id && (!token.role || token.isActive === undefined)) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: {
              role: true,
              isActive: true,
              name: true,
              image: true,
            },
          });

          if (dbUser) {
            token.role = dbUser.role;
            token.isActive = dbUser.isActive;
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }

      // Handle session updates
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.image = session.image;
        if (session.role) token.role = session.role;
        if (session.isActive !== undefined) token.isActive = session.isActive;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    },

    // IMPORTANT: This runs in middleware too!
    async authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      
      // Allow all auth routes
      if (pathname.startsWith('/auth/')) return true;
      
      // Check if user is logged in
      const isLoggedIn = !!auth?.user?.id;
      const isAdmin = auth?.user?.role === "ADMIN";
      const isActive = auth?.user?.isActive !== false;
      
      // Public routes that don't need auth
      const publicRoutes = ["/", "/api/auth"];
      if (publicRoutes.some(route => pathname.startsWith(route))) {
        return true;
      }
      
      // Protected routes need login
      if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
        if (!isLoggedIn || !isActive) return false;
        
        // Admin routes need ADMIN role
        if (pathname.startsWith('/admin') && !isAdmin) return false;
      }
      
      return true;
    },

    async signIn({ user, account }) {
      // Allow social sign-ins without email verification
      if (account?.provider !== "credentials") return true;

      // For credentials, check if user is active
      if (user.isActive === false) return false;

      return true;
    }
  },

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
          role: "USER",
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
          role: "USER",
          isActive: true,
        };
      }
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials);
        if (!validatedFields.success) return null;

        const { email, password } = validatedFields.data;

        try {
          const user = await db.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
              id: true,
              email: true,
              password: true,
              role: true,
              isActive: true,
              name: true,
              image: true,
            },
          });

          if (!user || !user.password || !user.isActive) return null;

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) return null;

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            image: user.image,
            isActive: user.isActive,
          };
        } catch (error) {
          console.error("Database error during authentication:", error);
          return null;
        }
      },
    }),
  ],
  
  // Use consistent secret name
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);