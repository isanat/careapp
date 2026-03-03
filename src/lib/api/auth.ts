import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";

/**
 * Validates that the current request is from an authenticated admin user.
 * Returns the session and admin user ID, or a NextResponse error.
 *
 * Usage:
 *   const auth = await requireAdmin();
 *   if (auth instanceof NextResponse) return auth;
 *   const { session, adminUserId } = auth;
 */
export async function requireAdmin(): Promise<
  | { session: { user: { id: string; email: string; name: string; role: string } }; adminUserId: string }
  | NextResponse
> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { session: session as any, adminUserId: session.user.id };
}

/**
 * Validates that the current request is from an authenticated user (any role).
 * Returns the session or a NextResponse error.
 */
export async function requireAuth(): Promise<
  | { session: { user: { id: string; email: string; name: string; role: string } } }
  | NextResponse
> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { session: session as any };
}
