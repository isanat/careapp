import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock db before importing route
vi.mock('@/lib/db-turso', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed_password') },
}));

vi.mock('ethers', () => ({
  ethers: {
    Wallet: {
      createRandom: () => ({
        address: '0xMockAddress123',
        privateKey: '0xMockPrivateKey456',
      }),
    },
  },
}));

vi.mock('crypto-js', () => ({
  default: {
    AES: { encrypt: vi.fn().mockReturnValue({ toString: () => 'encrypted_key' }) },
    lib: { WordArray: { random: vi.fn().mockReturnValue({ toString: () => 'mock_salt' }) } },
  },
}));

// Set env var before import
process.env.WALLET_ENCRYPTION_KEY = 'test-encryption-key-32chars!!!!!';

import { POST } from '../register/route';
import { db } from '@/lib/db-turso';

const mockDb = db as unknown as { execute: ReturnType<typeof vi.fn> };

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no existing user
    mockDb.execute.mockResolvedValue({ rows: [] });
  });

  const validBody = {
    name: 'Maria Silva',
    email: 'maria@example.com',
    password: 'SecurePass123',
    role: 'FAMILY',
    acceptTerms: true,
  };

  it('registers a new FAMILY user successfully', async () => {
    const res = await POST(createRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.userId).toBeDefined();
    expect(data.walletAddress).toBe('0xMockAddress123');
    expect(data.termsAccepted).toEqual(['terms_of_use', 'privacy_policy', 'mediation_policy']);
  });

  it('registers a CAREGIVER user successfully', async () => {
    const res = await POST(createRequest({ ...validBody, role: 'CAREGIVER' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 400 for invalid input', async () => {
    const res = await POST(createRequest({ name: 'M', email: 'bad', password: '1', role: 'X' }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid input');
    expect(data.details).toBeDefined();
  });

  it('returns 400 when email already exists', async () => {
    mockDb.execute.mockResolvedValueOnce({ rows: [{ id: 'existing-user' }] });

    const res = await POST(createRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Email already registered');
  });

  it('returns 400 when terms not accepted', async () => {
    const res = await POST(createRequest({ ...validBody, acceptTerms: false }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Terms acceptance is required');
  });

  it('creates user, wallet, profile, and terms records', async () => {
    await POST(createRequest(validBody));

    const calls = mockDb.execute.mock.calls;
    // 1: check existing user, 2: insert user, 3: insert wallet, 4: insert profile, 5-7: insert 3 terms
    expect(calls.length).toBe(7);

    // User insert
    expect(calls[1][0].sql).toContain('INSERT INTO User');
    expect(calls[1][0].args).toContain('maria@example.com');

    // Wallet insert
    expect(calls[2][0].sql).toContain('INSERT INTO Wallet');
    expect(calls[2][0].args).toContain('0xMockAddress123');

    // ProfileFamily insert (FAMILY role)
    expect(calls[3][0].sql).toContain('INSERT INTO ProfileFamily');

    // Terms acceptance (3 records)
    expect(calls[4][0].sql).toContain('INSERT INTO TermsAcceptance');
    expect(calls[5][0].sql).toContain('INSERT INTO TermsAcceptance');
    expect(calls[6][0].sql).toContain('INSERT INTO TermsAcceptance');
  });

  it('creates ProfileCaregiver for CAREGIVER role', async () => {
    await POST(createRequest({ ...validBody, role: 'CAREGIVER' }));

    const calls = mockDb.execute.mock.calls;
    expect(calls[3][0].sql).toContain('INSERT INTO ProfileCaregiver');
  });

  it('lowercases email before storing', async () => {
    await POST(createRequest({ ...validBody, email: 'MARIA@Example.COM' }));

    const checkCall = mockDb.execute.mock.calls[0];
    expect(checkCall[0].args[0]).toBe('maria@example.com');
  });
});
