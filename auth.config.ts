//auth.config.ts
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getUserByEmail } from "@/data/user";
import { LoginSchema } from "@/schemas";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);
        if (!validatedFields.success) return null;
        const { email, password } = validatedFields.data;
        
        const user = await getUserByEmail(email);
        if (!user || !user.password) return null;
        if (!user.isActive) return null;
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return null;
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          isActive: user.isActive,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }: any) {
      console.log("🔐 SignIn callback");
      console.log("Provider:", account?.provider);
      
      // Credentials login
      if (account?.provider === "credentials") {
        console.log("✅ Credentials login");
        return user.isActive !== false;
      }
      
      // OAuth login (Google)
      if (account?.provider === "google") {
        console.log("🔍 Checking Google user:", user.email);
        
        const existingUser = await db.user.findUnique({
          where: { email: user.email }
        });
        
        // Ako user postoji, proveri da li je aktivan
        if (existingUser) {
          console.log("✅ User exists in DB");
          if (!existingUser.isActive) {
            console.log("❌ User is inactive");
            return false;
          }
          return true;
        }
        
        // Novi user - PrismaAdapter će ga kreirati automatski
        // Ali treba da postavimo default role nakon kreiranja
        console.log("✅ New user - will be created by adapter");
        return true;
      }
      
      return true;
    },
    
    async jwt({ token, user, trigger }: any) {
      // Pri prvom loginu
      if (user) {
        console.log("🎫 JWT: Adding user data to token");
        token.id = user.id;
        token.role = user.role;
        token.isActive = user.isActive;
      }
      
      // Ako fali role ili isActive (npr. novi OAuth user)
      if (!token.role || token.isActive === undefined) {
        console.log("🔄 JWT: Loading missing data from DB");
        const dbUser = await db.user.findUnique({
          where: { email: token.email as string }
        });
        
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.isActive = dbUser.isActive;
        }
      }
      
      // Session refresh
      if (trigger === "update") {
        console.log("🔄 JWT: Refreshing session");
        const dbUser = await db.user.findUnique({
          where: { email: token.email as string }
        });
        
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.isActive = dbUser.isActive;
        }
      }
      
      return token;
    },
    
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role || "USER";
        session.user.isActive = token.isActive !== false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    signOut: "/auth/login",
  },
  events: {
    // ✅ Kada PrismaAdapter kreira novog usera
    async createUser({ user }) {
      console.log("👤 New user created by adapter:", user.email);
      
      // Osiguraj da novi OAuth user ima default role i isActive
      await db.user.update({
        where: { id: user.id },
        data: {
          role: "USER",
          isActive: true,
        }
      });
      
      console.log("✅ Default role and isActive set for new user");
    },
  },
};