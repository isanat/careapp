import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    // Return integration status (mock data for now)
    const integrations = [
      {
        name: "Stripe",
        type: "payment",
        status: process.env.STRIPE_SECRET_KEY ? "connected" : "not_configured",
        lastWebhook: null,
        connected: !!process.env.STRIPE_SECRET_KEY,
      },
      {
        name: "Turso Database",
        type: "database",
        status: process.env.TURSO_DATABASE_URL ? "connected" : "not_configured",
        lastWebhook: null,
        connected: !!process.env.TURSO_DATABASE_URL,
      },
      {
        name: "Didit KYC",
        type: "kyc",
        status: process.env.DIDIT_API_KEY ? "connected" : "not_configured",
        lastWebhook: null,
        connected: !!process.env.DIDIT_API_KEY,
      },
      {
        name: "SendGrid",
        type: "email",
        status: process.env.SENDGRID_API_KEY ? "connected" : "not_configured",
        lastWebhook: null,
        connected: !!process.env.SENDGRID_API_KEY,
      },
    ];

    return NextResponse.json({
      integrations,
    });
  } catch (error) {
    console.error("Admin integrations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 },
    );
  }
}
