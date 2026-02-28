import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";
import { stripeService } from "@/lib/services/stripe";
import { contractFeeSchema } from "@/lib/validations/schemas";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Pagamento temporariamente indisponível" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = contractFeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { contractId } = parsed.data;

    // Verify contract exists and user is the family
    const contractResult = await db.execute({
      sql: `SELECT id, familyUserId, caregiverUserId, status, familyFeePaid FROM Contract WHERE id = ?`,
      args: [contractId],
    });

    if (contractResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    const contract = contractResult.rows[0];

    if (contract.familyUserId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the family can pay the contract fee" },
        { status: 403 }
      );
    }

    if (contract.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "Contract is not in PENDING_PAYMENT status" },
        { status: 400 }
      );
    }

    if (contract.familyFeePaid === 1 || contract.familyFeePaid === true) {
      return NextResponse.json(
        { error: "Contract fee already paid" },
        { status: 400 }
      );
    }

    const result = await stripeService.createContractFeeCheckout(
      session.user.id,
      contractId
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating contract fee checkout:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session",
      },
      { status: 500 }
    );
  }
}
