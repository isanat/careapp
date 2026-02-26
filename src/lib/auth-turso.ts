import { db as tursoDb } from "@/lib/db-turso";
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

// Check if we're using Turso
const isTurso = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
    error: "/auth/login",
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
          // Query user from Turso
          const result = await tursoDb.execute({
            sql: `SELECT u.id, u.email, u.name, u.passwordHash, u.role, u.status, 
                         w.id as walletId
                  FROM User u 
                  LEFT JOIN Wallet w ON u.id = w.userId 
                  WHERE u.email = ?`,
            args: [credentials.email]
          });

          if (result.rows.length === 0) {
            console.log('User not found:', credentials.email);
            return null;
          }

          const user = result.rows[0];
          
          if (!user.passwordHash) {
            console.log('User has no password');
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.passwordHash as string
          );

          if (!passwordMatch) {
            console.log('Password mismatch');
            return null;
          }

          // Update last login
          await tursoDb.execute({
            sql: `UPDATE User SET lastLoginAt = CURRENT_TIMESTAMP WHERE id = ?`,
            args: [user.id]
          });

          return {
            id: user.id as string,
            email: user.email as string,
            name: user.name as string,
            role: user.role as string,
            status: user.status as string,
            hasWallet: !!user.walletId,
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
  // Required for production
  secret: process.env.NEXTAUTH_SECRET || "idosolink-secret-key-change-in-production",
  debug: process.env.NODE_ENV === 'development',
};
