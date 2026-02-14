import { NextRequest, NextResponse } from "next/server";
import { stripeService } from "@/lib/services/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const result = await stripeService.createActivationCheckout(userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating activation checkout:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
