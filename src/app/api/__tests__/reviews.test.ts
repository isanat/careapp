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

vi.mock('@/lib/utils/id', () => ({
  generateId: vi.fn().mockReturnValue('review-test-123'),
}));

import { GET, POST } from '../reviews/route';
import { db } from '@/lib/db-turso';

const mockDb = db as unknown as { execute: ReturnType<typeof vi.fn> };

const familySession = {
  user: { id: 'family-user-1', name: 'Maria', role: 'FAMILY', email: 'maria@test.com' },
};

const caregiverSession = {
  user: { id: 'caregiver-1', name: 'João', role: 'CAREGIVER', email: 'joao@test.com' },
};

function createGetRequest(params?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/reviews');
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }
  return new NextRequest(url);
}

function createPostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validReviewBody = {
  contractId: 'contract-1',
  toUserId: 'caregiver-1',
  rating: 5,
  comment: 'Excellent caregiver!',
  punctualityRating: 5,
  professionalismRating: 4,
  communicationRating: 5,
  qualityRating: 4,
};

describe('GET /api/reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without session', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET(createGetRequest());
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('filters by toUserId', async () => {
    mockGetServerSession.mockResolvedValue(familySession);
    mockDb.execute.mockResolvedValue({
      rows: [{
        id: 'review-1',
        contractId: 'contract-1',
        fromUserId: 'family-user-1',
        toUserId: 'caregiver-1',
        rating: 5,
        comment: 'Great',
        punctualityRating: 5,
        professionalismRating: 5,
        communicationRating: 5,
        qualityRating: 5,
        isPublic: 1,
        createdAt: '2025-03-01',
        reviewer_name: 'Maria',
        reviewer_role: 'FAMILY',
        contract_title: 'Cuidado Diário',
      }],
    });

    const res = await GET(createGetRequest({ toUserId: 'caregiver-1' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reviews).toHaveLength(1);

    const sql = mockDb.execute.mock.calls[0][0].sql;
    expect(sql).toContain('r.toUserId = ?');

    const args = mockDb.execute.mock.calls[0][0].args;
    expect(args).toContain('caregiver-1');
  });

  it('filters by fromUserId', async () => {
    mockGetServerSession.mockResolvedValue(familySession);
    mockDb.execute.mockResolvedValue({ rows: [] });

    await GET(createGetRequest({ fromUserId: 'family-user-1' }));

    const sql = mockDb.execute.mock.calls[0][0].sql;
    expect(sql).toContain('r.fromUserId = ?');

    const args = mockDb.execute.mock.calls[0][0].args;
    expect(args).toContain('family-user-1');
  });

  it('filters by contractId', async () => {
    mockGetServerSession.mockResolvedValue(familySession);
    mockDb.execute.mockResolvedValue({ rows: [] });

    await GET(createGetRequest({ contractId: 'contract-1' }));

    const sql = mockDb.execute.mock.calls[0][0].sql;
    expect(sql).toContain('r.contractId = ?');

    const args = mockDb.execute.mock.calls[0][0].args;
    expect(args).toContain('contract-1');
  });
});

describe('POST /api/reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without session', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(createPostRequest(validReviewBody));
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 with invalid input (Zod fails)', async () => {
    mockGetServerSession.mockResolvedValue(familySession);

    const res = await POST(createPostRequest({ rating: 0 }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid input');
    expect(data.details).toBeDefined();
  });

  it('returns 404 when contract not found', async () => {
    mockGetServerSession.mockResolvedValue(familySession);
    mockDb.execute.mockResolvedValue({ rows: [] });

    const res = await POST(createPostRequest(validReviewBody));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Contract not found');
  });

  it('returns 403 when user not part of contract', async () => {
    mockGetServerSession.mockResolvedValue(familySession);
    mockDb.execute.mockResolvedValue({
      rows: [{ familyUserId: 'other-family', caregiverUserId: 'other-caregiver', status: 'COMPLETED' }],
    });

    const res = await POST(createPostRequest(validReviewBody));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('You can only review contracts you participated in');
  });

  it('returns 400 when toUserId is not the other party', async () => {
    mockGetServerSession.mockResolvedValue(familySession);
    mockDb.execute.mockResolvedValue({
      rows: [{ familyUserId: 'family-user-1', caregiverUserId: 'caregiver-1', status: 'COMPLETED' }],
    });

    const res = await POST(createPostRequest({
      ...validReviewBody,
      toUserId: 'some-random-user',
    }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid toUserId for this contract');
  });

  it('returns 400 when already reviewed (duplicate)', async () => {
    mockGetServerSession.mockResolvedValue(familySession);
    // 1) Contract lookup
    mockDb.execute.mockResolvedValueOnce({
      rows: [{ familyUserId: 'family-user-1', caregiverUserId: 'caregiver-1', status: 'COMPLETED' }],
    });
    // 2) Existing review check
    mockDb.execute.mockResolvedValueOnce({
      rows: [{ id: 'existing-review' }],
    });

    const res = await POST(createPostRequest(validReviewBody));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('You have already reviewed this contract');
  });

  it('creates review and recalculates averageRating for CAREGIVER', async () => {
    mockGetServerSession.mockResolvedValue(familySession);

    // 1) Contract lookup
    mockDb.execute.mockResolvedValueOnce({
      rows: [{ familyUserId: 'family-user-1', caregiverUserId: 'caregiver-1', status: 'COMPLETED' }],
    });
    // 2) Existing review check - none found
    mockDb.execute.mockResolvedValueOnce({ rows: [] });
    // 3) INSERT review
    mockDb.execute.mockResolvedValueOnce({ rows: [] });
    // 4) User role lookup
    mockDb.execute.mockResolvedValueOnce({ rows: [{ role: 'CAREGIVER' }] });
    // 5) AVG rating calculation
    mockDb.execute.mockResolvedValueOnce({ rows: [{ avg_rating: 4.5, total: 10 }] });
    // 6) UPDATE ProfileCaregiver
    mockDb.execute.mockResolvedValueOnce({ rows: [] });

    const res = await POST(createPostRequest(validReviewBody));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reviewId).toBe('review-test-123');
    expect(data.message).toBe('Review created successfully');

    // Verify INSERT was called
    const insertCall = mockDb.execute.mock.calls[2][0];
    expect(insertCall.sql).toContain('INSERT INTO Review');
    expect(insertCall.args).toContain('review-test-123');

    // Verify rating recalculation
    const avgCall = mockDb.execute.mock.calls[4][0];
    expect(avgCall.sql).toContain('AVG(rating)');
    expect(avgCall.args).toContain('caregiver-1');

    // Verify ProfileCaregiver update
    const updateCall = mockDb.execute.mock.calls[5][0];
    expect(updateCall.sql).toContain('UPDATE ProfileCaregiver');
    expect(updateCall.args).toContain(4.5);
    expect(updateCall.args).toContain(10);
    expect(updateCall.args).toContain('caregiver-1');
  });
});
