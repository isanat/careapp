import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db-turso", () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { GET } from "../caregivers/route";
import { db } from "@/lib/db-turso";

const mockDb = db as unknown as { execute: ReturnType<typeof vi.fn> };

function createGetRequest(params?: Record<string, string>): NextRequest {
  const url = new URL("http://localhost:3000/api/caregivers");
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, value),
    );
  }
  return new NextRequest(url);
}

const sampleCaregiverRow = {
  id: "caregiver-1",
  name: "João Silva",
  profileImage: "https://example.com/photo.jpg",
  verificationStatus: "VERIFIED",
  title: "Cuidador Senior",
  bio: "Experienced caregiver",
  city: "Lisboa",
  services: "higiene,companhia,alimentação",
  hourlyRateEur: 1500,
  averageRating: 4.8,
  totalReviews: 25,
  totalContracts: 10,
  experienceYears: 5,
};

describe("GET /api/caregivers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns caregivers list (only VERIFIED + ACTIVE)", async () => {
    mockDb.execute.mockResolvedValue({
      rows: [sampleCaregiverRow],
    });

    const res = await GET(createGetRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.caregivers).toHaveLength(1);
    expect(data.caregivers[0].name).toBe("João Silva");
    expect(data.caregivers[0].services).toEqual([
      "higiene",
      "companhia",
      "alimentação",
    ]);

    // Verify SQL filters for VERIFIED + ACTIVE
    const sql = mockDb.execute.mock.calls[0][0].sql;
    expect(sql).toContain("u.status = 'ACTIVE'");
    expect(sql).toContain("u.verificationStatus = 'VERIFIED'");
    expect(sql).toContain("u.role = 'CAREGIVER'");
  });

  it("filters by city", async () => {
    mockDb.execute.mockResolvedValue({ rows: [sampleCaregiverRow] });

    await GET(createGetRequest({ city: "Lisboa" }));

    const sql = mockDb.execute.mock.calls[0][0].sql;
    expect(sql).toContain("p.city LIKE ?");

    const args = mockDb.execute.mock.calls[0][0].args;
    expect(args).toContain("%Lisboa%");
  });

  it("filters by service", async () => {
    mockDb.execute.mockResolvedValue({ rows: [sampleCaregiverRow] });

    await GET(createGetRequest({ service: "higiene" }));

    const sql = mockDb.execute.mock.calls[0][0].sql;
    expect(sql).toContain("p.services LIKE ?");

    const args = mockDb.execute.mock.calls[0][0].args;
    expect(args).toContain("%higiene%");
  });

  it("filters by minRating", async () => {
    mockDb.execute.mockResolvedValue({ rows: [sampleCaregiverRow] });

    await GET(createGetRequest({ minRating: "4.0" }));

    const sql = mockDb.execute.mock.calls[0][0].sql;
    expect(sql).toContain("p.averageRating >= ?");

    const args = mockDb.execute.mock.calls[0][0].args;
    expect(args).toContain("4.0");
  });

  it("returns Cache-Control header", async () => {
    mockDb.execute.mockResolvedValue({ rows: [sampleCaregiverRow] });

    const res = await GET(createGetRequest());

    const cacheControl = res.headers.get("Cache-Control");
    expect(cacheControl).toBe(
      "public, s-maxage=60, stale-while-revalidate=300",
    );
  });

  it("limits results (default 20)", async () => {
    mockDb.execute.mockResolvedValue({ rows: [] });

    await GET(createGetRequest());

    const args = mockDb.execute.mock.calls[0][0].args;
    // Last arg should be the limit
    expect(args[args.length - 1]).toBe("20");
  });

  it("returns empty array when no matches", async () => {
    mockDb.execute.mockResolvedValue({ rows: [] });

    const res = await GET(createGetRequest({ city: "NonexistentCity" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.caregivers).toEqual([]);
  });
});
