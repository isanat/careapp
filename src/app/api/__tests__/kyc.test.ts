import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/auth-turso", () => ({
  authOptions: {},
}));

vi.mock("@/lib/db-turso", () => ({
  db: { execute: vi.fn() },
}));

vi.mock("@/lib/services/didit", () => ({
  createKycSession: vi.fn(),
  getSessionStatus: vi.fn(),
}));

import { GET, POST } from "../../api/kyc/route";
import { db } from "@/lib/db-turso";

const mockDb = db as unknown as { execute: ReturnType<typeof vi.fn> };

const caregiverSession = {
  user: {
    id: "caregiver-1",
    name: "João",
    role: "CAREGIVER",
    email: "joao@test.com",
  },
};

const familySession = {
  user: {
    id: "family-1",
    name: "Maria",
    role: "FAMILY",
    email: "maria@test.com",
  },
};

describe("KYC API - GET /api/kyc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/kyc");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns KYC status for caregiver", async () => {
    mockGetServerSession.mockResolvedValue(caregiverSession);
    mockDb.execute.mockResolvedValue({
      rows: [
        {
          verificationStatus: "VERIFIED",
          kycSessionId: "session-123",
          kycSessionToken: "token-abc",
          kycCompletedAt: "2025-03-01",
          kycConfidence: 95,
        },
      ],
    });

    const req = new NextRequest("http://localhost:3000/api/kyc");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.verification_status).toBe("VERIFIED");
    expect(data.confidence).toBe(95);
  });

  it("returns KYC status for family user", async () => {
    mockGetServerSession.mockResolvedValue(familySession);
    mockDb.execute.mockResolvedValue({
      rows: [
        {
          verificationStatus: "UNVERIFIED",
          kycSessionId: null,
          kycSessionToken: null,
          kycCompletedAt: null,
          kycConfidence: 0,
        },
      ],
    });

    const req = new NextRequest("http://localhost:3000/api/kyc");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.verification_status).toBe("UNVERIFIED");
  });
});

describe("KYC API - POST /api/kyc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DIDIT_API_KEY = "test-key";
    process.env.DIDIT_API_SECRET = "test-secret";
    process.env.DIDIT_WORKFLOW_ID = "workflow-123";
    process.env.NEXT_PUBLIC_APP_URL = "https://careapp.test";
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/kyc", {
      method: "POST",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("prevents restart if already verified", async () => {
    mockGetServerSession.mockResolvedValue(caregiverSession);
    mockDb.execute.mockResolvedValue({
      rows: [{ verificationStatus: "VERIFIED" }],
    });

    const req = new NextRequest("http://localhost:3000/api/kyc", {
      method: "POST",
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Already verified");
  });
});
