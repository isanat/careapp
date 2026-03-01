import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetServerSession = vi.fn();
const mockCreateActivationCheckout = vi.fn();

vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock('@/lib/auth-turso', () => ({
  authOptions: {},
}));

vi.mock('@/lib/services/stripe', () => ({
  stripeService: {
    createActivationCheckout: (...args: unknown[]) => mockCreateActivationCheckout(...args),
  },
}));

import { POST } from '../payments/activation/route';

const userSession = {
  user: { id: 'user-1', name: 'Maria', role: 'FAMILY', email: 'maria@test.com' },
};

function createRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/payments/activation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

describe('POST /api/payments/activation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
  });

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(createRequest());
    expect(res.status).toBe(401);
  });

  it('returns 503 when Stripe is not configured', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    mockGetServerSession.mockResolvedValue(userSession);

    const res = await POST(createRequest());
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.error).toContain('indisponível');
  });

  it('creates checkout session for authenticated user', async () => {
    mockGetServerSession.mockResolvedValue(userSession);
    mockCreateActivationCheckout.mockResolvedValue({
      url: 'https://checkout.stripe.com/session_123',
      sessionId: 'cs_test_123',
    });

    const res = await POST(createRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.url).toContain('stripe.com');
    expect(mockCreateActivationCheckout).toHaveBeenCalledWith('user-1');
  });

  it('uses authenticated user ID, not request body', async () => {
    mockGetServerSession.mockResolvedValue(userSession);
    mockCreateActivationCheckout.mockResolvedValue({ url: 'https://checkout.stripe.com/x' });

    await POST(createRequest());

    // Should use session user ID, not anything from body
    expect(mockCreateActivationCheckout).toHaveBeenCalledWith('user-1');
  });

  it('returns 503 for invalid Stripe credentials', async () => {
    mockGetServerSession.mockResolvedValue(userSession);
    mockCreateActivationCheckout.mockRejectedValue(new Error('Invalid API Key provided'));

    const res = await POST(createRequest());
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.error).toContain('indisponível');
  });

  it('returns 500 for generic Stripe errors', async () => {
    mockGetServerSession.mockResolvedValue(userSession);
    mockCreateActivationCheckout.mockRejectedValue(new Error('Card declined'));

    const res = await POST(createRequest());
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Card declined');
  });
});
