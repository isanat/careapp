import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Only admins can run migrations
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 403 }
    );
  }

  try {
    const tursoUrl = process.env.TURSO_DATABASE_URL || "";
    const tursoToken = process.env.TURSO_AUTH_TOKEN || "";

    if (!tursoUrl || !tursoToken) {
      return NextResponse.json(
        { error: "Turso credentials not configured" },
        { status: 500 }
      );
    }

    // Extract the HTTP endpoint from the libsql URL
    // libsql://idosolink-isanat.aws-us-east-1.turso.io => https://idosolink-isanat.aws-us-east-1.turso.io
    const httpUrl = tursoUrl
      .replace("libsql://", "https://")
      .split("?")[0];

    // SQL statements to execute
    const statements = [
      'ALTER TABLE "Demand" ADD COLUMN "closedReason" TEXT;',
      'ALTER TABLE "Demand" ADD COLUMN "deletedAt" DATETIME;',
      'ALTER TABLE "Demand" ADD COLUMN "deletionReason" TEXT;',
      'CREATE INDEX "Demand_deletedAt_idx" ON "Demand"("deletedAt");',
    ];

    const results: Array<{
      statement: string;
      success: boolean;
      error?: string;
    }> = [];

    // Execute each statement
    for (const stmt of statements) {
      try {
        const response = await fetch(`${httpUrl}/v2/pipeline`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tursoToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                type: "execute",
                stmt: {
                  sql: stmt,
                },
              },
            ],
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          results.push({
            statement: stmt,
            success: false,
            error: (data as any).error || response.statusText,
          });
        } else {
          results.push({
            statement: stmt,
            success: true,
          });
        }
      } catch (error) {
        results.push({
          statement: stmt,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const allSuccess = results.every((r) => r.success);

    return NextResponse.json({
      success: allSuccess,
      results,
      message: allSuccess
        ? "Migration completed successfully"
        : "Migration completed with errors",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
