import { db } from "@/lib/db";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      status: string;
      hasWallet: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    status: string;
    hasWallet: boolean;
  }
}

// Check if we're in production (Vercel)
const isProduction = process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions = {
  // Only use PrismaAdapter if DATABASE_URL is set and not SQLite
  ...(process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:") 
    ? { adapter: PrismaAdapter(db) } 
    : {}),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
    error: "/auth/login",
    verifyRequest: "/auth/verify",
    newUser: "/onboarding",
  },
  providers: [
    // Only include Google provider if credentials are configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET 
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
            include: { wallet: true },
          });

          if (!user || !user.passwordHash) {
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!passwordMatch) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            hasWallet: !!user.wallet,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.hasWallet = user.hasWallet;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.hasWallet = token.hasWallet;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Update last login only if database is available
      try {
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      } catch (error) {
        console.error("Failed to update last login:", error);
      }
    },
  },
  // Required for production
  secret: process.env.NEXTAUTH_SECRET || "idosolink-secret-key-change-in-production",
  debug: !isProduction,
};
