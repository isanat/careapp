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
const hasDatabase = process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:");

// Demo users for when database is not available
const DEMO_USERS = [
  {
    id: "demo-family-1",
    email: "familia@teste.com",
    name: "Maria Silva",
    role: "FAMILY",
    status: "ACTIVE",
    hasWallet: true,
    passwordHash: "$2a$10$rQZ9QxZ9QxZ9QxZ9QxZ9Q.9QxZ9QxZ9QxZ9QxZ9QxZ9QxZ9QxZ9Qx", // teste123
  },
  {
    id: "demo-caregiver-1",
    email: "cuidador@teste.com",
    name: "Ana Cuidadora",
    role: "CAREGIVER",
    status: "ACTIVE",
    hasWallet: true,
    passwordHash: "$2a$10$rQZ9QxZ9QxZ9QxZ9QxZ9Q.9QxZ9QxZ9QxZ9QxZ9QxZ9QxZ9QxZ9Qx", // teste123
  },
];

// Hash the demo passwords at startup
async function getDemoUsers() {
  const passwordHash = await bcrypt.hash("teste123", 10);
  return DEMO_USERS.map(user => ({ ...user, passwordHash }));
}

export const authOptions: NextAuthOptions = {
  // Only use PrismaAdapter if DATABASE_URL is set and not SQLite
  ...(hasDatabase ? { adapter: PrismaAdapter(db) } : {}),
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
          // If database is available, use it
          if (hasDatabase) {
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
          }
          
          // Otherwise, use demo users
          const demoUsers = await getDemoUsers();
          const user = demoUsers.find(u => u.email === credentials.email);
          
          if (!user) {
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
            hasWallet: user.hasWallet,
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
      if (hasDatabase) {
        try {
          await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        } catch (error) {
          console.error("Failed to update last login:", error);
        }
      }
    },
  },
  // Required for production
  secret: process.env.NEXTAUTH_SECRET || "idosolink-secret-key-change-in-production",
  debug: !isProduction,
};
