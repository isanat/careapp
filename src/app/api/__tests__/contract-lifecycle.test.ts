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
  db: {
    execute: vi.fn(),
  },
}));

vi.mock("@/lib/utils/id", () => ({
  generateId: vi.fn().mockReturnValue("test-id-123"),
}));

import { GET, POST } from "../contracts/[id]/accept/route";
import { db } from "@/lib/db-turso";

const mockDb = db as unknown as { execute: ReturnType<typeof vi.fn> };

const familySession = {
  user: {
    id: "family-user-1",
    name: "Maria",
    role: "FAMILY",
    email: "maria@test.com",
  },
};

const caregiverSession = {
  user: {
    id: "caregiver-1",
    name: "João",
    role: "CAREGIVER",
    email: "joao@test.com",
  },
};

const outsiderSession = {
  user: {
    id: "outsider-1",
    name: "Outsider",
    role: "FAMILY",
    email: "outsider@test.com",
  },
};

function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function createGetRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/contracts/ctr_1/accept");
}

function createPostRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/contracts/ctr_1/accept", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "192.168.1.1",
      "user-agent": "test-agent",
    },
  });
}

const mockContract = {
  familyUserId: "family-user-1",
  caregiverUserId: "caregiver-1",
  status: "DRAFT",
};

describe("GET /api/contracts/[id]/accept", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET(createGetRequest(), createParams("ctr_1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when contract not found", async () => {
    mockGetServerSession.mockResolvedValue(familySession);
    mockDb.execute.mockResolvedValue({ rows: [] });

    const res = await GET(createGetRequest(), createParams("ctr_nonexistent"));
    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not family or caregiver on the contract", async () => {
    mockGetServerSession.mockResolvedValue(outsiderSession);
    mockDb.execute.mockResolvedValue({ rows: [mockContract] });

    const res = await GET(createGetRequest(), createParams("ctr_1"));
    expect(res.status).toBe(403);
  });

  it("returns 200 with acceptance details when acceptance exists", async () => {
    mockGetServerSession.mockResolvedValue(familySession);
    // 1st call: contract lookup
    mockDb.execute.mockResolvedValueOnce({ rows: [mockContract] });
    // 2nd call: acceptance lookup
    mockDb.execute.mockResolvedValueOnce({
      rows: [
        {
          acceptedByFamilyAt: "2025-03-01T10:00:00Z",
          acceptedByCaregiverAt: "2025-03-01T11:00:00Z",
          familyIpAddress: "192.168.1.1",
          caregiverIpAddress: "192.168.1.2",
        },
      ],
    });

    const res = await GET(createGetRequest(), createParams("ctr_1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.accepted).toBe(true);
    expect(data.familyAccepted).toBe(true);
    expect(data.caregiverAccepted).toBe(true);
    expect(data.familyIpAddress).toBe("192.168.1.1");
    expect(data.caregiverIpAddress).toBe("192.168.1.2");
  });

  it("returns 200 with accepted:false when no acceptance record", async () => {
    mockGetServerSession.mockResolvedValue(familySession);
    // 1st call: contract lookup
    mockDb.execute.mockResolvedValueOnce({ rows: [mockContract] });
    // 2nd call: acceptance lookup (empty)
    mockDb.execute.mockResolvedValueOnce({ rows: [] });

    const res = await GET(createGetRequest(), createParams("ctr_1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.accepted).toBe(false);
    expect(data.familyAccepted).toBe(false);
    expect(data.caregiverAccepted).toBe(false);
  });
});

describe("POST /api/contracts/[id]/accept", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(createPostRequest(), createParams("ctr_1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when contract not found", async () => {
    mockGetServerSession.mockResolvedValue(familySession);
    mockDb.execute.mockResolvedValue({ rows: [] });

    const res = await POST(
      createPostRequest(),
      createParams("ctr_nonexistent"),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when user not part of contract", async () => {
    mockGetServerSession.mockResolvedValue(outsiderSession);
    mockDb.execute.mockResolvedValue({ rows: [mockContract] });

    const res = await POST(createPostRequest(), createParams("ctr_1"));
    expect(res.status).toBe(403);
  });

  it("family accepts and creates new ContractAcceptance", async () => {
    mockGetServerSession.mockResolvedValue(familySession);
    // 1st: contract lookup
    mockDb.execute.mockResolvedValueOnce({ rows: [mockContract] });
    // 2nd: existing acceptance lookup (none)
    mockDb.execute.mockResolvedValueOnce({ rows: [] });
    // 3rd: INSERT ContractAcceptance
    mockDb.execute.mockResolvedValueOnce({ rows: [] });
    // 4th: UPDATE Contract (family accepted)
    mockDb.execute.mockResolvedValueOnce({ rows: [] });
    // 5th: check if both accepted
    mockDb.execute.mockResolvedValueOnce({
      rows: [
        {
          acceptedByFamilyAt: "2025-03-01T10:00:00Z",
          acceptedByCaregiverAt: null,
        },
      ],
    });

    const res = await POST(createPostRequest(), createParams("ctr_1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.bothAccepted).toBeFalsy();
    expect(data.newStatus).toBe("PENDING_ACCEPTANCE");

    // Verify INSERT was called with the generated ID
    const insertCall = mockDb.execute.mock.calls[2][0];
    expect(insertCall.sql).toContain("INSERT INTO ContractAcceptance");
    expect(insertCall.args[0]).toBe("test-id-123");
  });

  it("caregiver accepts and creates new ContractAcceptance", async () => {
    mockGetServerSession.mockResolvedValue(caregiverSession);
    // 1st: contract lookup
    mockDb.execute.mockResolvedValueOnce({ rows: [mockContract] });
    // 2nd: existing acceptance lookup (none)
    mockDb.execute.mockResolvedValueOnce({ rows: [] });
    // 3rd: INSERT ContractAcceptance (caregiver)
    mockDb.execute.mockResolvedValueOnce({ rows: [] });
    // 4th: UPDATE Contract (caregiver accepted)
    mockDb.execute.mockResolvedValueOnce({ rows: [] });
    // 5th: check if both accepted
    mockDb.execute.mockResolvedValueOnce({
      rows: [
        {
          acceptedByFamilyAt: null,
          acceptedByCaregiverAt: "2025-03-01T11:00:00Z",
        },
      ],
    });

    const res = await POST(createPostRequest(), createParams("ctr_1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.bothAccepted).toBeFalsy();
    expect(data.newStatus).toBe("PENDING_ACCEPTANCE");

    // Verify INSERT was for caregiver
    const insertCall = mockDb.execute.mock.calls[2][0];
    expect(insertCall.sql).toContain("INSERT INTO ContractAcceptance");
    expect(insertCall.sql).toContain("acceptedByCaregiverAt");
  });

  it("returns bothAccepted:true and PENDING_PAYMENT when both accepted", async () => {
    mockGetServerSession.mockResolvedValue(caregiverSession);
    // 1st: contract lookup
    mockDb.execute.mockResolvedValueOnce({ rows: [mockContract] });
    // 2nd: existing acceptance lookup (family already accepted)
    mockDb.execute.mockResolvedValueOnce({
      rows: [
        {
          acceptedByFamilyAt: "2025-03-01T10:00:00Z",
          acceptedByCaregiverAt: null,
        },
      ],
    });
    // 3rd: UPDATE existing acceptance (caregiver)
    mockDb.execute.mockResolvedValueOnce({ rows: [] });
    // 4th: UPDATE Contract
    mockDb.execute.mockResolvedValueOnce({ rows: [] });
    // 5th: check if both accepted
    mockDb.execute.mockResolvedValueOnce({
      rows: [
        {
          acceptedByFamilyAt: "2025-03-01T10:00:00Z",
          acceptedByCaregiverAt: "2025-03-01T11:00:00Z",
        },
      ],
    });
    // 6th: UPDATE Contract to PENDING_PAYMENT
    mockDb.execute.mockResolvedValueOnce({ rows: [] });

    const res = await POST(createPostRequest(), createParams("ctr_1"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.bothAccepted).toBeTruthy();
    expect(data.newStatus).toBe("PENDING_PAYMENT");

    // Verify the final UPDATE sets status to PENDING_PAYMENT
    const lastCall = mockDb.execute.mock.calls[5][0];
    expect(lastCall.sql).toContain("PENDING_PAYMENT");
  });
});
