//auth.config.ts

import Credentials from "next-auth/providers/credentials";
import { getUserByEmail } from "@/data/user";
import { LoginSchema } from "@/schemas";
import bcrypt from "bcryptjs";

export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        // 1. Validacija unosa
        const validatedFields = LoginSchema.safeParse(credentials);
        if (!validatedFields.success) return null;

        const { email, password } = validatedFields.data;

        // 2. Nađi usera po emailu
        const user = await getUserByEmail(email);
        if (!user) return null;

        // 3. Proveri da li je aktivan
        if (!user.isActive) return null;

        // 4. Validacija passworda
        const isPasswordValid = await bcrypt.compare(
          password,
          user.password || ""
        );
        if (!isPasswordValid) return null;

        // 5. Vrati podatke o useru sa svim potrebnim poljima
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          isTwoFactorEnabled: user.isTwoFactorEnabled ?? false, // ✅ Added
          isOAuth: false, // ✅ Added - credentials login is not OAuth
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      // Ako je nova prijava, upiši vrednosti
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isActive = user.isActive;
      }

      // Ako fali role ili isActive, povuci iz DB
      if (token.id && (!token.role || token.isActive === undefined)) {
        try {
          const dbUser = await getUserByEmail(token.email as string);
          if (dbUser) {
            token.role = dbUser.role;
            token.isActive = dbUser.isActive;
          }
        } catch (err) {
          console.error("Error refreshing token from DB:", err);
        }
      }

      // Session update scenario
      if (trigger === "update" && session?.user) {
        return { ...token, ...session.user };
      }

      return token;
    },

    async session({ session, token }: any) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id || "",
          role: token.role || "USER",
          isActive: token.isActive !== undefined ? token.isActive : true,
        },
      };
    },

    async signIn({ user, account }: any) {
      // Ako nije credentials login, pusti
      if (account?.provider !== "credentials") return true;

      // Ako nije aktivan, odbij
      return user.isActive !== false;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
};