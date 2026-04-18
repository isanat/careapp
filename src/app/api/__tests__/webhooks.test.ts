import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Hoisted mocks (available inside vi.mock factories) ────────────────────────

const { mockConstructEvent, mockHandleWebhook, mockVerifySignature } =
  vi.hoisted(() => ({
    mockConstructEvent: vi.fn(),
    mockHandleWebhook: vi.fn(),
    mockVerifySignature: vi.fn(),
  }));

vi.mock("stripe", () => {
  const StripeMock = function () {
    return { webhooks: { constructEvent: mockConstructEvent } };
  };
  return { default: StripeMock };
});

vi.mock("@/lib/services/stripe", () => ({
  stripeService: { handleWebhook: mockHandleWebhook },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("test-signature"),
  }),
}));

vi.mock("@/lib/services/easypay", () => ({
  easypayService: { verifyWebhookSignature: mockVerifySignature },
  EasypayWebhookData: {},
}));

vi.mock("@/lib/db-turso", () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock("@/lib/utils/id", () => ({
  generateId: vi.fn().mockReturnValue("test-id-123"),
}));

// ── Imports AFTER mocks ───────────────────────────────────────────────────────

import { POST as stripeWebhookPOST } from "../webhooks/stripe/route";
import { POST as easypayWebhookPOST } from "../webhooks/easypay/route";
import { db } from "@/lib/db-turso";
import { headers } from "next/headers";

const mockDb = db as unknown as { execute: ReturnType<typeof vi.fn> };
const mockHeaders = headers as unknown as ReturnType<typeof vi.fn>;

// ── Stripe Webhook Tests ──────────────────────────────────────────────────────

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createStripeRequest(
    body = '{"type":"checkout.session.completed"}',
  ): NextRequest {
    return new NextRequest("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "test-signature",
      },
      body,
    });
  }

  it("returns 400 when no stripe-signature header", async () => {
    mockHeaders.mockResolvedValue({
      get: vi.fn().mockReturnValue(null),
    });

    const req = new NextRequest("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      body: "{}",
    });

    const res = await stripeWebhookPOST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain("Missing stripe-signature");
  });

  it("returns 400 when constructEvent throws (invalid signature)", async () => {
    mockHeaders.mockResolvedValue({
      get: vi.fn().mockReturnValue("bad-signature"),
    });
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const res = await stripeWebhookPOST(createStripeRequest());
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain("Invalid signature");
  });

  it("returns 200 when event processed successfully", async () => {
    mockHeaders.mockResolvedValue({
      get: vi.fn().mockReturnValue("valid-signature"),
    });

    const mockEvent = {
      type: "checkout.session.completed",
      data: { object: {} },
    };
    mockConstructEvent.mockReturnValue(mockEvent);
    mockHandleWebhook.mockResolvedValue(undefined);

    const res = await stripeWebhookPOST(createStripeRequest());
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.received).toBe(true);
    expect(mockHandleWebhook).toHaveBeenCalledWith(mockEvent);
  });

  it("returns 500 when handleWebhook throws", async () => {
    mockHeaders.mockResolvedValue({
      get: vi.fn().mockReturnValue("valid-signature"),
    });

    const mockEvent = {
      type: "checkout.session.completed",
      data: { object: {} },
    };
    mockConstructEvent.mockReturnValue(mockEvent);
    mockHandleWebhook.mockRejectedValue(new Error("Processing failed"));

    const res = await stripeWebhookPOST(createStripeRequest());
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.error).toContain("Webhook handler failed");
  });
});

// ── Easypay Webhook Tests ─────────────────────────────────────────────────────

describe("POST /api/webhooks/easypay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseWebhookBody = {
    id: 1,
    uid: "ep-uid-123",
    transaction_key: "txn-key-456",
    status: "ok" as const,
    status_payment: "paid" as const,
    method: "mb",
    type: "sale",
    amount: 50.0,
    currency: "EUR",
    created_at: "2025-03-01T10:00:00Z",
    paid_at: "2025-03-01T10:05:00Z",
    customer: { id: "cust-1", name: "Maria", email: "maria@test.com" },
  };

  const mockPayment = {
    id: "pay_1",
    userId: "user-1",
    type: "TOKEN_PURCHASE",
    metadata: JSON.stringify({ transactionKey: "txn-key-456" }),
    status: "PENDING",
  };

  function createEasypayRequest(
    body: Record<string, unknown> = baseWebhookBody,
  ): NextRequest {
    return new NextRequest("http://localhost:3000/api/webhooks/easypay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-easypay-signature": "valid-sig",
      },
      body: JSON.stringify(body),
    });
  }

  it("returns 401 when signature is invalid", async () => {
    mockVerifySignature.mockReturnValue(false);

    const res = await easypayWebhookPOST(createEasypayRequest());
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toContain("Invalid signature");
  });

  it("returns 404 when payment not found", async () => {
    mockVerifySignature.mockReturnValue(true);
    mockDb.execute.mockResolvedValue({ rows: [] });

    const res = await easypayWebhookPOST(createEasypayRequest());
    expect(res.status).toBe(404);

    const data = await res.json();
    expect(data.error).toContain("Payment not found");
  });

  it("returns 200 and processes paid status: updates Payment and creates notification", async () => {
    mockVerifySignature.mockReturnValue(true);

    // 1st: find payment
    mockDb.execute.mockResolvedValueOnce({ rows: [mockPayment] });
    // 2nd: UPDATE Payment to COMPLETED
    mockDb.execute.mockResolvedValueOnce({ rows: [] });
    // 3rd: INSERT Notification
    mockDb.execute.mockResolvedValueOnce({ rows: [] });

    const res = await easypayWebhookPOST(createEasypayRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.paymentId).toBe("pay_1");
    expect(data.status).toBe("paid");

    // Verify Payment updated to COMPLETED
    const updatePaymentCall = mockDb.execute.mock.calls[1][0];
    expect(updatePaymentCall.sql).toContain("status = 'COMPLETED'");
  });

  it("returns 200 and processes failed status: updates Payment to FAILED", async () => {
    mockVerifySignature.mockReturnValue(true);

    const failedBody = {
      ...baseWebhookBody,
      status: "ok",
      status_payment: "failed",
    };

    // 1st: find payment
    mockDb.execute.mockResolvedValueOnce({ rows: [mockPayment] });
    // 2nd: UPDATE Payment to FAILED
    mockDb.execute.mockResolvedValueOnce({ rows: [] });

    const res = await easypayWebhookPOST(createEasypayRequest(failedBody));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe("failed");

    // Verify Payment updated to FAILED
    const updateCall = mockDb.execute.mock.calls[1][0];
    expect(updateCall.sql).toContain("status = 'FAILED'");
  });

  it("returns 200 and processes refunded status: updates Payment to REFUNDED", async () => {
    mockVerifySignature.mockReturnValue(true);

    const refundedBody = {
      ...baseWebhookBody,
      status: "ok",
      status_payment: "refunded",
    };

    // 1st: find payment
    mockDb.execute.mockResolvedValueOnce({ rows: [mockPayment] });
    // 2nd: UPDATE Payment to REFUNDED
    mockDb.execute.mockResolvedValueOnce({ rows: [] });

    const res = await easypayWebhookPOST(createEasypayRequest(refundedBody));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe("refunded");

    // Verify Payment updated to REFUNDED
    const updateCall = mockDb.execute.mock.calls[1][0];
    expect(updateCall.sql).toContain("status = 'REFUNDED'");
    expect(updateCall.sql).toContain("refundedAt");
  });
});
