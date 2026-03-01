import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetServerSession = vi.fn();
const mockCreateMBWayPayment = vi.fn();
const mockCreateMultibancoReference = vi.fn();
const mockCreateCardPayment = vi.fn();
const mockGetPayment = vi.fn();

vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock('@/lib/auth-turso', () => ({
  authOptions: {},
}));

vi.mock('@/lib/db-turso', () => ({
  db: { execute: vi.fn() },
}));

vi.mock('@/lib/services/easypay', () => ({
  easypayService: {
    createMBWayPayment: (...args: unknown[]) => mockCreateMBWayPayment(...args),
    createMultibancoReference: (...args: unknown[]) => mockCreateMultibancoReference(...args),
    createCardPayment: (...args: unknown[]) => mockCreateCardPayment(...args),
    getPayment: (...args: unknown[]) => mockGetPayment(...args),
  },
}));

vi.mock('@/lib/constants', () => ({
  APP_NAME: 'Senior Care',
}));

import { POST, GET } from '../payments/easypay/route';
import { db } from '@/lib/db-turso';

const mockDb = db as unknown as { execute: ReturnType<typeof vi.fn> };

const userSession = {
  user: { id: 'user-1', name: 'Maria', role: 'FAMILY', email: 'maria@test.com' },
};

function createPostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/payments/easypay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/payments/easypay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.EASYPAY_API_KEY = 'test-key';
    process.env.EASYPAY_ACCOUNT_ID = 'test-account';

    mockDb.execute.mockResolvedValue({
      rows: [{ id: 'user-1', name: 'Maria', email: 'maria@test.com', phone: '912345678' }],
    });
  });

  it('returns 503 when Easypay not configured', async () => {
    delete process.env.EASYPAY_API_KEY;
    mockGetServerSession.mockResolvedValue(userSession);

    const res = await POST(createPostRequest({ type: 'activation', method: 'cc', amount: 35 }));
    expect(res.status).toBe(503);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(createPostRequest({ type: 'activation', method: 'cc', amount: 35 }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing fields', async () => {
    mockGetServerSession.mockResolvedValue(userSession);

    const res = await POST(createPostRequest({ type: 'activation' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid method', async () => {
    mockGetServerSession.mockResolvedValue(userSession);

    const res = await POST(createPostRequest({ type: 'activation', method: 'bitcoin', amount: 35 }));
    expect(res.status).toBe(400);
  });

  it('creates MB Way payment with phone required', async () => {
    mockGetServerSession.mockResolvedValue(userSession);
    mockCreateMBWayPayment.mockResolvedValue({
      uid: 'ep-uid-1',
      id: 123,
      mbway: { request_id: 'req-1', alias: '912****78' },
    });

    const res = await POST(createPostRequest({
      type: 'activation',
      method: 'mbway',
      amount: 35,
      phone: '912345678',
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.method).toBe('mbway');
    expect(data.mbway.requestId).toBe('req-1');
    expect(mockCreateMBWayPayment).toHaveBeenCalledTimes(1);
  });

  it('creates Multibanco reference', async () => {
    mockGetServerSession.mockResolvedValue(userSession);
    mockCreateMultibancoReference.mockResolvedValue({
      uid: 'ep-uid-2',
      id: 124,
      multibanco: { entity: '21000', reference: '123456789', amount: 35, expires_at: '2025-04-01' },
    });

    const res = await POST(createPostRequest({
      type: 'activation',
      method: 'multibanco',
      amount: 35,
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.multibanco.entity).toBe('21000');
    expect(data.multibanco.reference).toBe('123456789');
  });

  it('creates card payment with redirect URL', async () => {
    mockGetServerSession.mockResolvedValue(userSession);
    mockCreateCardPayment.mockResolvedValue({
      uid: 'ep-uid-3',
      id: 125,
      creditcard: { url: 'https://pay.easypay.pt/checkout/xyz' },
    });

    const res = await POST(createPostRequest({
      type: 'activation',
      method: 'cc',
      amount: 35,
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.creditcard.url).toContain('easypay.pt');
  });

  it('stores payment record and Easypay UID in DB', async () => {
    mockGetServerSession.mockResolvedValue(userSession);
    mockCreateCardPayment.mockResolvedValue({ uid: 'ep-uid-4', id: 126 });

    await POST(createPostRequest({ type: 'activation', method: 'cc', amount: 35 }));

    // 1: get user data, 2: insert Payment, 3: update Payment with UID
    expect(mockDb.execute).toHaveBeenCalledTimes(3);

    // Verify Payment insert
    const insertCall = mockDb.execute.mock.calls[1][0];
    expect(insertCall.sql).toContain('INSERT INTO Payment');
    expect(insertCall.sql).toContain('EASYPAY');
    expect(insertCall.args).toContain(3500); // 35 * 100 cents
  });
});

describe('GET /api/payments/easypay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/payments/easypay?paymentId=pay-1');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when no ID provided', async () => {
    mockGetServerSession.mockResolvedValue(userSession);

    const req = new NextRequest('http://localhost:3000/api/payments/easypay');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns payment status with Easypay data', async () => {
    mockGetServerSession.mockResolvedValue(userSession);
    mockDb.execute.mockResolvedValue({
      rows: [{
        id: 'pay-1',
        status: 'PENDING',
        amountEurCents: 3500,
        tokensAmount: 35,
        stripeCheckoutSessionId: 'ep-uid-1',
        createdAt: '2025-03-01',
        paidAt: null,
      }],
    });
    mockGetPayment.mockResolvedValue({
      status_payment: 'paid',
      method: 'mbway',
    });

    const req = new NextRequest('http://localhost:3000/api/payments/easypay?paymentId=pay-1');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.paymentId).toBe('pay-1');
    expect(data.easypayStatus).toBe('paid');
  });
});
