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

import { GET } from "../user/profile/route";
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

function createGetRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/user/profile");
}

const mockFamilyUser = {
  id: "family-user-1",
  email: "maria@test.com",
  name: "Maria",
  phone: "912345678",
  role: "FAMILY",
  status: "ACTIVE",
  profileImage: null,
  nif: "123456789",
  documentType: "CC",
  documentNumber: "CC123456",
  backgroundCheckStatus: null,
  backgroundCheckUrl: null,
  createdAt: "2025-01-01T00:00:00Z",
};

const mockCaregiverUser = {
  id: "caregiver-1",
  email: "joao@test.com",
  name: "João",
  phone: "913456789",
  role: "CAREGIVER",
  status: "ACTIVE",
  profileImage: "https://example.com/photo.jpg",
  nif: "987654321",
  documentType: "CC",
  documentNumber: "CC654321",
  backgroundCheckStatus: "VERIFIED",
  backgroundCheckUrl: "https://example.com/check",
  createdAt: "2025-01-15T00:00:00Z",
};

const mockFamilyProfile = {
  id: "pf_1",
  city: "Lisboa",
  elderName: "Ana",
  elderAge: 82,
  elderNeeds: "mobilidade,higiene",
  emergencyContactName: "Carlos",
  emergencyContactPhone: "914567890",
};

const mockCaregiverProfile = {
  id: "pc_1",
  title: "Cuidador Senior",
  bio: "Experiência em cuidados geriátricos",
  experienceYears: 5,
  city: "Porto",
  services: '["higiene","companhia","alimentação"]',
  hourlyRateEur: 1500,
  averageRating: 4.8,
  totalReviews: 12,
  totalContracts: 8,
  certifications: "Primeiro Socorro",
  languages: "Português,Inglês",
};

const mockWallet = {
  address: "wallet-addr-1",
  balanceEurCents: 50000,
};

describe("GET /api/user/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET(createGetRequest());
    expect(res.status).toBe(401);
  });

  it("returns 404 when user not found", async () => {
    mockGetServerSession.mockResolvedValue(familySession);
    // User query returns empty
    mockDb.execute.mockResolvedValue({ rows: [] });

    const res = await GET(createGetRequest());
    expect(res.status).toBe(404);

    const data = await res.json();
    expect(data.error).toContain("User not found");
  });

  it("returns FAMILY profile with user and ProfileFamily data", async () => {
    mockGetServerSession.mockResolvedValue(familySession);
    // 1st: user query
    mockDb.execute.mockResolvedValueOnce({ rows: [mockFamilyUser] });
    // 2nd: ProfileFamily query
    mockDb.execute.mockResolvedValueOnce({ rows: [mockFamilyProfile] });
    // 3rd: Wallet query
    mockDb.execute.mockResolvedValueOnce({ rows: [mockWallet] });

    const res = await GET(createGetRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.id).toBe("family-user-1");
    expect(data.user.name).toBe("Maria");
    expect(data.user.role).toBe("FAMILY");
    expect(data.user.nif).toBe("123456789");

    expect(data.profile.city).toBe("Lisboa");
    expect(data.profile.elderName).toBe("Ana");
    expect(data.profile.elderAge).toBe(82);
    expect(data.profile.emergencyContact).toBe("Carlos");
    expect(data.profile.emergencyPhone).toBe("914567890");

    expect(data.wallet.address).toBe("wallet-addr-1");
  });

  it("returns CAREGIVER profile with services parsed from JSON", async () => {
    mockGetServerSession.mockResolvedValue(caregiverSession);
    // 1st: user query
    mockDb.execute.mockResolvedValueOnce({ rows: [mockCaregiverUser] });
    // 2nd: ProfileCaregiver query
    mockDb.execute.mockResolvedValueOnce({ rows: [mockCaregiverProfile] });
    // 3rd: Wallet query
    mockDb.execute.mockResolvedValueOnce({ rows: [mockWallet] });

    const res = await GET(createGetRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.id).toBe("caregiver-1");
    expect(data.user.name).toBe("João");
    expect(data.user.role).toBe("CAREGIVER");
    expect(data.user.backgroundCheckStatus).toBe("VERIFIED");

    expect(data.profile.title).toBe("Cuidador Senior");
    expect(data.profile.bio).toBe("Experiência em cuidados geriátricos");
    expect(data.profile.experienceYears).toBe(5);
    expect(data.profile.city).toBe("Porto");
    expect(data.profile.hourlyRateEur).toBe(1500);
    expect(data.profile.averageRating).toBe(4.8);
    expect(data.profile.totalReviews).toBe(12);
    expect(data.profile.totalContracts).toBe(8);

    // Services should be parsed from JSON string to array
    expect(data.profile.services).toEqual([
      "higiene",
      "companhia",
      "alimentação",
    ]);
  });
});
