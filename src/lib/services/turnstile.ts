const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResult {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Verify a Cloudflare Turnstile CAPTCHA token server-side.
 * Returns true if verification succeeds or if Turnstile is not configured (graceful degradation).
 */
export async function verifyTurnstileToken(token: string | null | undefined, remoteIp?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If Turnstile is not configured, skip verification (allow graceful degradation)
  if (!secretKey) {
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const body: Record<string, string> = {
      secret: secretKey,
      response: token,
    };

    if (remoteIp) {
      body.remoteip = remoteIp;
    }

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result: TurnstileVerifyResult = await res.json();
    return result.success === true;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    // Fail open to avoid blocking registration when Turnstile is down
    return true;
  }
}
