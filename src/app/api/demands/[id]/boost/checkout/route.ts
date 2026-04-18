import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { stripeService } from "@/lib/services/stripe";

interface BoostCheckoutRequest {
  package: "BASIC" | "PREMIUM" | "URGENT";
}

/**
 * POST /api/demands/[id]/boost/checkout
 * Criar sessão de checkout Stripe para boost de visibilidade
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: demandId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: BoostCheckoutRequest = await request.json();
    const { package: boostPackage } = body;

    if (
      !boostPackage ||
      !["BASIC", "PREMIUM", "URGENT"].includes(boostPackage)
    ) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    const checkoutSession = await stripeService.createVisibilityBoostCheckout(
      session.user.id,
      demandId,
      boostPackage as "BASIC" | "PREMIUM" | "URGENT",
    );

    return NextResponse.json(checkoutSession);
  } catch (error) {
    console.error("[Boost Checkout API] Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create checkout session";
    return NextResponse.json(
      { error: message },
      {
        status:
          error instanceof Error && error.message === "Unauthorized"
            ? 403
            : 500,
      },
    );
  }
}
