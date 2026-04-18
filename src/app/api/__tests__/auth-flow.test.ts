import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db-turso", () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock("@/lib/services/email", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/validations/schemas", () => ({
  forgotPasswordSchema: {
    safeParse: vi
      .fn()
      .mockReturnValue({ success: true, data: { email: "test@test.com" } }),
  },
  resetPasswordSchema: {
    safeParse: vi.fn().mockReturnValue({
      success: true,
      data: {
        token: "test-token",
        email: "test@test.com",
        password: "NewPass123!",
      },
    }),
  },
}));

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("hashed-password") },
}));

import { POST as forgotPasswordPOST } from "../auth/forgot-password/route";
import { POST as resetPasswordPOST } from "../auth/reset-password/route";
import { db } from "@/lib/db-turso";
import { sendPasswordResetEmail } from "@/lib/services/email";
import { forgotPasswordSchema } from "@/lib/validations/schemas";
import { resetPasswordSchema } from "@/lib/validations/schemas";

const mockDb = db as unknown as { execute: ReturnType<typeof vi.fn> };
const mockSendEmail = sendPasswordResetEmail as ReturnType<typeof vi.fn>;
const mockForgotSchema = forgotPasswordSchema.safeParse as ReturnType<
  typeof vi.fn
>;
const mockResetSchema = resetPasswordSchema.safeParse as ReturnType<
  typeof vi.fn
>;

function createPostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockForgotSchema.mockReturnValue({
      success: true,
      data: { email: "test@test.com" },
    });
  });

  it("returns 400 when email invalid (safeParse fails)", async () => {
    mockForgotSchema.mockReturnValue({
      success: false,
      error: { flatten: () => ({ fieldErrors: { email: ["Invalid email"] } }) },
    });

    const res = await forgotPasswordPOST(
      createPostRequest({ email: "invalid" }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Valid email is required");
  });

  it("returns success even when email does not exist (anti-enumeration)", async () => {
    // User not found
    mockDb.execute.mockResolvedValue({ rows: [] });

    const res = await forgotPasswordPOST(
      createPostRequest({ email: "nonexistent@test.com" }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    // Should NOT have called sendPasswordResetEmail
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("generates token and calls sendPasswordResetEmail", async () => {
    // User found
    mockDb.execute
      .mockResolvedValueOnce({
        rows: [{ id: "user-1", email: "test@test.com" }],
      }) // SELECT user
      .mockResolvedValueOnce({ rows: [] }) // DELETE existing tokens
      .mockResolvedValueOnce({ rows: [] }); // INSERT new token

    const res = await forgotPasswordPOST(
      createPostRequest({ email: "test@test.com" }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify token was stored
    const insertCall = mockDb.execute.mock.calls[2][0];
    expect(insertCall.sql).toContain("INSERT INTO VerificationToken");

    // Verify email was sent
    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledWith(
      "test@test.com",
      expect.stringContaining("token="),
    );
  });
});

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResetSchema.mockReturnValue({
      success: true,
      data: {
        token: "test-token",
        email: "test@test.com",
        password: "NewPass123!",
      },
    });
  });

  it("returns 400 when input invalid", async () => {
    mockResetSchema.mockReturnValue({
      success: false,
      error: { flatten: () => ({ fieldErrors: { password: ["Too short"] } }) },
    });

    const res = await resetPasswordPOST(
      createPostRequest({ token: "", email: "", password: "" }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid input");
    expect(data.details).toBeDefined();
  });

  it("returns 400 when token not found", async () => {
    // Token lookup returns nothing
    mockDb.execute.mockResolvedValue({ rows: [] });

    const res = await resetPasswordPOST(
      createPostRequest({
        token: "invalid-token",
        email: "test@test.com",
        password: "NewPass123!",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid or expired reset token");
  });

  it("returns 400 when token expired", async () => {
    const expiredDate = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hour ago
    // Token found but expired
    mockDb.execute
      .mockResolvedValueOnce({
        rows: [
          {
            identifier: "test@test.com",
            token: "hashed-token",
            expires: expiredDate,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }); // DELETE expired token

    const res = await resetPasswordPOST(
      createPostRequest({
        token: "test-token",
        email: "test@test.com",
        password: "NewPass123!",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("expired");

    // Verify expired token was cleaned up
    const deleteCall = mockDb.execute.mock.calls[1][0];
    expect(deleteCall.sql).toContain("DELETE FROM VerificationToken");
  });

  it("updates password and deletes token on success", async () => {
    const futureDate = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour from now
    // 1) Token lookup - valid
    mockDb.execute.mockResolvedValueOnce({
      rows: [
        {
          identifier: "test@test.com",
          token: "hashed-token",
          expires: futureDate,
        },
      ],
    });
    // 2) UPDATE user password
    mockDb.execute.mockResolvedValueOnce({ rowsAffected: 1 });
    // 3) DELETE used token
    mockDb.execute.mockResolvedValueOnce({ rows: [] });

    const res = await resetPasswordPOST(
      createPostRequest({
        token: "test-token",
        email: "test@test.com",
        password: "NewPass123!",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify password was updated
    const updateCall = mockDb.execute.mock.calls[1][0];
    expect(updateCall.sql).toContain("UPDATE User SET passwordHash");
    expect(updateCall.args).toContain("hashed-password");

    // Verify token was deleted
    const deleteCall = mockDb.execute.mock.calls[2][0];
    expect(deleteCall.sql).toContain("DELETE FROM VerificationToken");
  });
});
