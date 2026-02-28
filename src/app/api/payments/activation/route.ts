import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { stripeService } from "@/lib/services/stripe";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          error: "Pagamento temporariamente indisponível",
          details: "O sistema de pagamento não está configurado. Entre em contato com o suporte."
        },
        { status: 503 }
      );
    }

    // Use the authenticated user's ID - don't accept arbitrary userId from body
    const userId = session.user.id;

    const result = await stripeService.createActivationCheckout(userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating activation checkout:", error);
    
    // Check for specific Stripe errors
    const errorMessage = error instanceof Error ? error.message : "Failed to create checkout session";
    
    if (errorMessage.includes("Invalid API Key") || errorMessage.includes("authentication")) {
      return NextResponse.json(
        { 
          error: "Pagamento temporariamente indisponível",
          details: "As credenciais de pagamento não estão configuradas corretamente. Entre em contato com o suporte." 
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
