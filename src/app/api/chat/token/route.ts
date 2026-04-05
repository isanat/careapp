import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = '24h';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate JWT token for Socket.IO authentication
    const token = jwt.sign(
      {
        sub: session.user.id,
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return NextResponse.json({
      token,
      expiresIn: TOKEN_EXPIRY,
    });
  } catch (error) {
    console.error('Error generating chat token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
