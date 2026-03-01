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
  db: {
    execute: vi.fn(),
  },
}));

import { GET, POST } from '../contracts/route';
import { db } from '@/lib/db-turso';

const mockDb = db as unknown as { execute: ReturnType<typeof vi.fn> };

const familySession = {
  user: { id: 'family-user-1', name: 'Maria', role: 'FAMILY', email: 'maria@test.com' },
};

const caregiverSession = {
  user: { id: 'caregiver-1', name: 'João', role: 'CAREGIVER', email: 'joao@test.com' },
};

function createGetRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/contracts');
}

function createPostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/contracts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET(createGetRequest());
    expect(res.status).toBe(401);
  });

  it('returns contracts for FAMILY user with caregiver info', async () => {
    mockGetServerSession.mockResolvedValue(familySession);
    mockDb.execute.mockResolvedValue({
      rows: [{
        id: 'ctr_1',
        status: 'ACTIVE',
        title: 'Cuidado Diário',
        description: 'Acompanhamento',
        hourlyRateEur: 1500,
        totalHours: 40,
        totalEurCents: 60000,
        startDate: '2025-03-01',
        endDate: null,
        createdAt: '2025-02-28',
        serviceTypes: 'higiene,companhia',
        hoursPerWeek: 20,
        caregiver_name: 'João',
        caregiver_title: 'Cuidador Senior',
        caregiver_city: 'Lisboa',
      }],
    });

    const res = await GET(createGetRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.contracts).toHaveLength(1);
    expect(data.contracts[0].otherParty.name).toBe('João');
    expect(data.contracts[0].serviceTypes).toEqual(['higiene', 'companhia']);

    // Verify FAMILY query joins on caregiverUserId
    const sql = mockDb.execute.mock.calls[0][0].sql;
    expect(sql).toContain('familyUserId = ?');
  });

  it('returns contracts for CAREGIVER user with family info', async () => {
    mockGetServerSession.mockResolvedValue(caregiverSession);
    mockDb.execute.mockResolvedValue({
      rows: [{
        id: 'ctr_2',
        status: 'DRAFT',
        title: 'Cuidado Noturno',
        description: '',
        hourlyRateEur: 2000,
        totalHours: 20,
        totalEurCents: 40000,
        startDate: null,
        endDate: null,
        createdAt: '2025-02-28',
        serviceTypes: '',
        hoursPerWeek: 0,
        family_name: 'Maria',
        family_email: 'maria@test.com',
        family_phone: '912345678',
        family_city: 'Porto',
        elder_name: 'Ana',
        elder_needs: 'mobilidade',
      }],
    });

    const res = await GET(createGetRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.contracts[0].family.name).toBe('Maria');
    expect(data.contracts[0].family.elderName).toBe('Ana');

    const sql = mockDb.execute.mock.calls[0][0].sql;
    expect(sql).toContain('caregiverUserId = ?');
  });
});

describe('POST /api/contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue(familySession);
    // Mock: 1) KYC check (both verified), 2) INSERT contract
    mockDb.execute
      .mockResolvedValueOnce({
        rows: [
          { id: 'family-user-1', verificationStatus: 'VERIFIED', role: 'FAMILY' },
          { id: 'caregiver-1', verificationStatus: 'VERIFIED', role: 'CAREGIVER' },
        ],
      })
      .mockResolvedValueOnce({ rows: [] });
  });

  const validBody = {
    caregiverUserId: 'caregiver-1',
    title: 'Cuidado Diário',
    hourlyRateEur: 1500,
    totalHours: 40,
  };

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(createPostRequest(validBody));
    expect(res.status).toBe(401);
  });

  it('creates a contract successfully', async () => {
    const res = await POST(createPostRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.contractId).toMatch(/^ctr_/);
  });

  it('stores contract with DRAFT status', async () => {
    await POST(createPostRequest(validBody));

    // calls[0] = KYC check, calls[1] = INSERT
    const sql = mockDb.execute.mock.calls[1][0].sql;
    expect(sql).toContain("'DRAFT'");
    expect(sql).toContain('INSERT INTO Contract');
  });

  it('calculates totalEurCents correctly', async () => {
    await POST(createPostRequest(validBody));

    // calls[0] = KYC check, calls[1] = INSERT
    const args = mockDb.execute.mock.calls[1][0].args;
    // totalEurCents = hourlyRateEur * totalHours = 1500 * 40 = 60000
    expect(args).toContain(60000);
  });

  it('returns 400 for invalid input', async () => {
    const res = await POST(createPostRequest({ title: 'X' }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid input');
  });

  it('accepts optional fields', async () => {
    const res = await POST(createPostRequest({
      ...validBody,
      description: 'Cuidado integral ao idoso',
      startDate: '2025-04-01',
      endDate: '2025-06-01',
      serviceTypes: 'higiene,alimentação',
      hoursPerWeek: 20,
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
