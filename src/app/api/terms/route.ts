import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// Terms types available
const TERMS_TYPES: Record<string, { version: string; required: boolean }> = {
  terms_of_use: { version: '1.0', required: true },
  privacy_policy: { version: '1.0', required: true },
  contract_template: { version: '1.0', required: false },
  mediation_policy: { version: '1.0', required: true },
  cookie_policy: { version: '1.0', required: false },
};

// Get user's terms acceptance status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const termsType = searchParams.get('type');

    if (termsType) {
      // Get specific term acceptance
      const result = await db.execute({
        sql: `SELECT * FROM TermsAcceptance WHERE userId = ? AND termsType = ? ORDER BY acceptedAt DESC LIMIT 1`,
        args: [userId, termsType]
      });

      if (result.rows.length === 0) {
        return NextResponse.json({
          accepted: false,
          termsType,
          required: TERMS_TYPES[termsType]?.required ?? false
        });
      }

      const acceptance = result.rows[0];
      return NextResponse.json({
        accepted: true,
        termsType,
        version: acceptance.termsVersion,
        acceptedAt: acceptance.acceptedAt,
        ipAddress: acceptance.ipAddress,
        currentVersion: TERMS_TYPES[termsType]?.version || '1.0',
        isCurrent: acceptance.termsVersion === TERMS_TYPES[termsType]?.version
      });
    }

    // Get all terms acceptance status
    const result = await db.execute({
      sql: `SELECT * FROM TermsAcceptance WHERE userId = ?`,
      args: [userId]
    });

    const acceptedTerms = result.rows.reduce((acc, row) => {
      const type = row.termsType as string;
      if (!acc[type] || new Date(row.acceptedAt as string) > new Date(acc[type].acceptedAt)) {
        acc[type] = {
          version: row.termsVersion,
          acceptedAt: row.acceptedAt,
          ipAddress: row.ipAddress,
        };
      }
      return acc;
    }, {} as Record<string, { version: string; acceptedAt: string; ipAddress: string }>);

    const termsStatus = Object.entries(TERMS_TYPES).map(([type, config]) => ({
      type,
      version: config.version,
      required: config.required,
      accepted: !!acceptedTerms[type],
      acceptedVersion: acceptedTerms[type]?.version || null,
      acceptedAt: acceptedTerms[type]?.acceptedAt || null,
      isCurrent: acceptedTerms[type]?.version === config.version
    }));

    const allRequiredAccepted = termsStatus
      .filter(t => t.required)
      .every(t => t.accepted && t.isCurrent);

    return NextResponse.json({
      terms: termsStatus,
      allRequiredAccepted,
      missingRequired: termsStatus.filter(t => t.required && (!t.accepted || !t.isCurrent))
    });
  } catch (error) {
    console.error('Error fetching terms acceptance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Accept terms (for logged-in users)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { termsType, version } = body;

    if (!termsType || !TERMS_TYPES[termsType]) {
      return NextResponse.json({ error: 'Invalid terms type' }, { status: 400 });
    }

    const userId = session.user.id;
    const termsVersion = version || TERMS_TYPES[termsType].version;
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const acceptanceId = `ta-${Date.now()}`;
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO TermsAcceptance (id, userId, termsType, termsVersion, ipAddress, userAgent, acceptedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [acceptanceId, userId, termsType, termsVersion, ipAddress, userAgent, now]
    });

    return NextResponse.json({
      success: true,
      termsType,
      version: termsVersion,
      acceptedAt: now,
      ipAddress
    });
  } catch (error) {
    console.error('Error accepting terms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
