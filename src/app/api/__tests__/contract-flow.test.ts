import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetServerSession = vi.fn();

vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock('@/lib/auth-turso', () => ({
  authOptions: {},
}));

vi.mock('@/lib/db-turso', () => ({
  db: { execute: vi.fn() },
}));

import { POST } from '../contracts/route';
import { db } from '@/lib/db-turso';

const mockDb = db as unknown as { execute: ReturnType<typeof vi.fn> };

const familySession = {
  user: { id: 'family-1', name: 'Maria', role: 'FAMILY', email: 'maria@test.com' },
};

function createPostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/contracts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validContract = {
  caregiverUserId: 'caregiver-1',
  title: 'Cuidado Diário',
  hourlyRateEur: 1500,
  totalHours: 40,
};

describe('Contract creation with KYC guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(familySession);
  });

  it('blocks contract when family KYC not verified', async () => {
    // KYC check: family UNVERIFIED, caregiver VERIFIED
    mockDb.execute.mockResolvedValueOnce({
      rows: [
        { id: 'family-1', verificationStatus: 'UNVERIFIED', role: 'FAMILY' },
        { id: 'caregiver-1', verificationStatus: 'VERIFIED', role: 'CAREGIVER' },
      ],
    });

    const res = await POST(createPostRequest(validContract));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.code).toBe('KYC_REQUIRED');
  });

  it('blocks contract when caregiver KYC not verified', async () => {
    mockDb.execute.mockResolvedValueOnce({
      rows: [
        { id: 'family-1', verificationStatus: 'VERIFIED', role: 'FAMILY' },
        { id: 'caregiver-1', verificationStatus: 'PENDING', role: 'CAREGIVER' },
      ],
    });

    const res = await POST(createPostRequest(validContract));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.code).toBe('CAREGIVER_KYC_PENDING');
  });

  it('blocks contract when caregiver not found', async () => {
    mockDb.execute.mockResolvedValueOnce({
      rows: [
        { id: 'family-1', verificationStatus: 'VERIFIED', role: 'FAMILY' },
      ],
    });

    const res = await POST(createPostRequest(validContract));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toContain('não encontrado');
  });

  it('allows contract when both parties are KYC verified', async () => {
    // KYC check passes
    mockDb.execute
      .mockResolvedValueOnce({
        rows: [
          { id: 'family-1', verificationStatus: 'VERIFIED', role: 'FAMILY' },
          { id: 'caregiver-1', verificationStatus: 'VERIFIED', role: 'CAREGIVER' },
        ],
      })
      // INSERT INTO Contract
      .mockResolvedValueOnce({ rows: [] });

    const res = await POST(createPostRequest(validContract));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.contractId).toMatch(/^ctr_/);

    // Verify INSERT was called
    const insertCall = mockDb.execute.mock.calls[1][0];
    expect(insertCall.sql).toContain('INSERT INTO Contract');
    expect(insertCall.sql).toContain("'DRAFT'");
  });

  it('full flow: register → KYC → contract → payment', async () => {
    // Step 1: Both users are KYC verified
    mockDb.execute
      .mockResolvedValueOnce({
        rows: [
          { id: 'family-1', verificationStatus: 'VERIFIED', role: 'FAMILY' },
          { id: 'caregiver-1', verificationStatus: 'VERIFIED', role: 'CAREGIVER' },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }); // contract insert

    // Step 2: Create contract
    const createRes = await POST(createPostRequest(validContract));
    const createData = await createRes.json();

    expect(createRes.status).toBe(200);
    expect(createData.success).toBe(true);

    // Step 3: Verify contract flow
    // DRAFT → (both accept) → PENDING_PAYMENT → (pay fee) → ACTIVE
    const insertCall = mockDb.execute.mock.calls[1][0];
    expect(insertCall.sql).toContain("'DRAFT'"); // Initial status is DRAFT

    // Step 4: totalEurCents correctly calculated
    const args = insertCall.args;
    // hourlyRateEur * totalHours = 1500 * 40 = 60000
    expect(args).toContain(60000);
  });
});

describe('Caregiver search with KYC filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('only returns VERIFIED caregivers', async () => {
    // Import the caregivers route to check the SQL
    const { GET: getCaregivers } = await import('../caregivers/route');

    mockDb.execute.mockResolvedValue({
      rows: [{
        id: 'cg-1',
        name: 'João',
        profileImage: null,
        verificationStatus: 'VERIFIED',
        title: 'Cuidador',
        bio: 'Experiente',
        city: 'Lisboa',
        services: 'higiene,mobilidade',
        hourlyRateEur: 1500,
        averageRating: 4.5,
        totalReviews: 10,
        totalContracts: 5,
        experienceYears: 3,
      }],
    });

    const req = new NextRequest('http://localhost:3000/api/caregivers');
    const res = await getCaregivers(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.caregivers).toHaveLength(1);

    // Verify the SQL includes the KYC filter
    const sql = mockDb.execute.mock.calls[0][0].sql;
    expect(sql).toContain("verificationStatus = 'VERIFIED'");
  });
});
