import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-turso";
import { RtcTokenBuilder, RtcRole } from "agora-token";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelName } = await request.json();

    if (!channelName) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 },
      );
    }

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return NextResponse.json(
        { error: "Agora credentials not configured" },
        { status: 500 },
      );
    }

    // Generate token valid for 24 hours
    const expirationTimeInSeconds = 24 * 60 * 60;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Use UID=0 so Agora auto-assigns a numeric UID on join
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      0,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs,
    );

    return NextResponse.json({
      token,
      appId,
      channelName,
      uid: 0,
      expiresIn: expirationTimeInSeconds,
    });
  } catch (error) {
    console.error("Error generating Agora token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 },
    );
  }
}
