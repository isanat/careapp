import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const mockGetServerSession = vi.fn();

vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock('@/lib/auth-turso', () => ({
  authOptions: {},
}));

import { requireAdmin, requireAuth } from '@/lib/api/auth';

const adminSession = {
  user: { id: 'admin-1', name: 'Admin User', role: 'ADMIN', email: 'admin@test.com' },
};

const familySession = {
  user: { id: 'family-user-1', name: 'Maria', role: 'FAMILY', email: 'maria@test.com' },
};

const caregiverSession = {
  user: { id: 'caregiver-1', name: 'João', role: 'CAREGIVER', email: 'joao@test.com' },
};

describe('requireAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns NextResponse 401 when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await requireAdmin();

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it('returns NextResponse 403 when role is not ADMIN', async () => {
    mockGetServerSession.mockResolvedValue(familySession);

    const result = await requireAdmin();

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(403);
  });

  it('returns {session, adminUserId} for admin user', async () => {
    mockGetServerSession.mockResolvedValue(adminSession);

    const result = await requireAdmin();

    expect(result).not.toBeInstanceOf(NextResponse);
    const auth = result as { session: typeof adminSession; adminUserId: string };
    expect(auth.session.user.id).toBe('admin-1');
    expect(auth.session.user.role).toBe('ADMIN');
    expect(auth.adminUserId).toBe('admin-1');
  });
});

describe('requireAuth()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns NextResponse 401 when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await requireAuth();

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it('returns {session} for authenticated FAMILY user', async () => {
    mockGetServerSession.mockResolvedValue(familySession);

    const result = await requireAuth();

    expect(result).not.toBeInstanceOf(NextResponse);
    const auth = result as { session: typeof familySession };
    expect(auth.session.user.id).toBe('family-user-1');
    expect(auth.session.user.role).toBe('FAMILY');
  });

  it('returns {session} for authenticated CAREGIVER user', async () => {
    mockGetServerSession.mockResolvedValue(caregiverSession);

    const result = await requireAuth();

    expect(result).not.toBeInstanceOf(NextResponse);
    const auth = result as { session: typeof caregiverSession };
    expect(auth.session.user.id).toBe('caregiver-1');
    expect(auth.session.user.role).toBe('CAREGIVER');
  });

  it('returns {session} for authenticated ADMIN user', async () => {
    mockGetServerSession.mockResolvedValue(adminSession);

    const result = await requireAuth();

    expect(result).not.toBeInstanceOf(NextResponse);
    const auth = result as { session: typeof adminSession };
    expect(auth.session.user.id).toBe('admin-1');
    expect(auth.session.user.role).toBe('ADMIN');
  });
});
