import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import crypto from 'crypto';

const CHAT_TOKEN_SECRET = process.env.CHAT_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || 'default-chat-secret';
const TOKEN_EXPIRY_SECONDS = 3600; // 1 hour

function generateChatToken(userId: string, userName: string): string {
  const payload = {
    userId,
    userName,
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS,
    iat: Math.floor(Date.now() / 1000),
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', CHAT_TOKEN_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = generateChatToken(session.user.id, session.user.name || '');

    return NextResponse.json({
      token,
      expiresIn: TOKEN_EXPIRY_SECONDS,
    });
  } catch (error) {
    console.error('Error generating chat token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
