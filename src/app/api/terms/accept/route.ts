import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-turso';

// Accept terms during registration (before user is fully authenticated)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, termsTypes } = body;

    if (!userId || !termsTypes || !Array.isArray(termsTypes)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const now = new Date().toISOString();

    // Accept all specified terms
    for (const termsType of termsTypes) {
      const acceptanceId = `ta-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      await db.execute({
        sql: `INSERT INTO TermsAcceptance (id, userId, termsType, termsVersion, ipAddress, userAgent, acceptedAt)
              VALUES (?, ?, ?, '1.0', ?, ?, ?)`,
        args: [acceptanceId, userId, termsType, ipAddress, userAgent, now]
      });
    }

    return NextResponse.json({
      success: true,
      acceptedTerms: termsTypes,
      acceptedAt: now,
      ipAddress
    });
  } catch (error) {
    console.error('Error accepting terms during registration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
