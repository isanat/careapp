import { NextResponse } from "next/server";
import { setCsrfCookie } from "@/lib/csrf";

export async function GET() {
  const response = NextResponse.json({ ok: true });
  const token = setCsrfCookie(response);
  response.headers.set("x-csrf-token", token);
  return response;
}
