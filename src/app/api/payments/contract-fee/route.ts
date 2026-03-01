import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { db } from "@/lib/db-turso";
import { generateId } from "@/lib/utils/id";
import { easypayService } from "@/lib/services/easypay";
import { contractFeeSchema } from "@/lib/validations/schemas";
import { CONTRACT_FEE_EUR_CENTS, APP_NAME } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Easypay is configured
    if (!process.env.EASYPAY_API_KEY || !process.env.EASYPAY_ACCOUNT_ID) {
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
    const method = body.method || "cc"; // mbway, multibanco, cc

    if (!["mbway", "multibanco", "cc"].includes(method)) {
      return NextResponse.json(
        { error: "Método de pagamento inválido" },
        { status: 400 }
      );
    }

    // Verify contract exists and user is the family
    const contractResult = await db.execute({
      sql: `SELECT id, familyUserId, caregiverUserId, status, familyFeePaid, totalEurCents FROM Contract WHERE id = ?`,
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

    if (Number(contract.familyFeePaid) === 1 || Boolean(contract.familyFeePaid) === true) {
      return NextResponse.json(
        { error: "Contract fee already paid" },
        { status: 400 }
      );
    }

    // Get user data for Easypay customer
    const userResult = await db.execute({
      sql: `SELECT name, email, phone FROM User WHERE id = ?`,
      args: [session.user.id],
    });
    const user = userResult.rows[0];

    // Create payment record
    const paymentId = generateId("pay");
    const transactionKey = generateId();
    const feeAmount = CONTRACT_FEE_EUR_CENTS / 100; // Convert cents to EUR
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO Payment (id, userId, type, status, provider, amountEurCents, contractId, description, createdAt)
            VALUES (?, ?, 'CONTRACT_FEE', 'PENDING', 'EASYPAY', ?, ?, ?, ?)`,
      args: [paymentId, session.user.id, CONTRACT_FEE_EUR_CENTS, contractId, `Taxa de contrato ${APP_NAME}`, now],
    });

    // Create Easypay payment
    const customer = {
      id: session.user.id,
      name: user.name as string,
      email: user.email as string,
      phone: body.phone || (user.phone as string) || "",
    };

    const easypayResponse = await easypayService.createCardPayment({
      transactionKey,
      amount: feeAmount,
      customer,
      description: `Taxa de contrato - ${APP_NAME}`,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app/contracts/${contractId}?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app/contracts/${contractId}?cancelled=true`,
    });

    // Store Easypay reference
    await db.execute({
      sql: `UPDATE Payment SET stripeCheckoutSessionId = ?, metadata = ? WHERE id = ?`,
      args: [
        easypayResponse.uid,
        JSON.stringify({ easypayId: easypayResponse.id, transactionKey, method, contractId }),
        paymentId,
      ],
    });

    return NextResponse.json({
      success: true,
      paymentId,
      method,
      transactionKey,
      easypayUid: easypayResponse.uid,
      creditcard: easypayResponse.creditcard,
      multibanco: easypayResponse.multibanco,
      mbway: easypayResponse.mbway,
    });
  } catch (error) {
    console.error("Error creating contract fee payment:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao processar pagamento",
      },
      { status: 500 }
    );
  }
}
