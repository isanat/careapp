import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripeService } from "@/lib/services/stripe";

// Lazy-load Stripe to avoid initialization errors during build
let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    stripeInstance = new Stripe(apiKey, {
      apiVersion: "2023-10-16" as any,
    });
  }
  return stripeInstance;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || "",
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await stripeService.handleWebhook(event);
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
