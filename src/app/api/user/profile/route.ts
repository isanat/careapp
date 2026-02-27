import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const isCaregiver = session.user.role === 'CAREGIVER';
    const isFamily = session.user.role === 'FAMILY';

    // Get basic user info
    const userResult = await db.execute({
      sql: `SELECT id, email, name, phone, role, status, profileImage, createdAt 
            FROM User WHERE id = ?`,
      args: [userId]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Get profile based on role
    let profile: Record<string, any> = null;

    if (isCaregiver) {
      const profileResult = await db.execute({
        sql: `SELECT id, title, bio, experienceYears, city, services, 
                     hourlyRateEur, averageRating, totalReviews, totalContracts,
                     certifications, languages
              FROM ProfileCaregiver WHERE userId = ?`,
        args: [userId]
      });

      if (profileResult.rows.length > 0) {
        const row = profileResult.rows[0];
        let services = [];
        try {
          if (row.services) {
            services = typeof row.services === 'string' 
              ? JSON.parse(row.services)
              : row.services;
          }
        } catch (e) {
          services = String(row.services).split(',').filter(Boolean);
        }

        profile = {
          title: row.title,
          bio: row.bio,
          experienceYears: row.experienceYears,
          city: row.city,
          services: services,
          hourlyRateEur: row.hourlyRateEur,
          averageRating: row.averageRating,
          totalReviews: row.totalReviews,
          totalContracts: row.totalContracts,
          certifications: row.certifications,
          languages: row.languages,
        };
      }
    }

    if (isFamily) {
      const profileResult = await db.execute({
        sql: `SELECT id, city, elderName, elderAge, emergencyContactName, emergencyContactPhone
              FROM ProfileFamily WHERE userId = ?`,
        args: [userId]
      });

      if (profileResult.rows.length > 0) {
        const row = profileResult.rows[0];
        profile = {
          city: row.city,
          elderName: row.elderName,
          elderAge: row.elderAge,
          emergencyContact: row.emergencyContactName,
          emergencyPhone: row.emergencyContactPhone,
        };
      }
    }

    // Get wallet info
    const walletResult = await db.execute({
      sql: `SELECT address, balanceTokens FROM Wallet WHERE userId = ?`,
      args: [userId]
    });

    const wallet = walletResult.rows.length > 0 ? {
      address: walletResult.rows[0].address,
      balanceTokens: walletResult.rows[0].balanceTokens,
    } : null;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
      profile,
      wallet,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const userId = session.user.id;
    const isCaregiver = session.user.role === 'CAREGIVER';
    const isFamily = session.user.role === 'FAMILY';

    // Update user basic info
    if (body.name || body.phone) {
      await db.execute({
        sql: `UPDATE User SET name = ?, phone = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [body.name || '', body.phone || null, userId]
      });
    }

    // Update profile based on role
    if (isCaregiver) {
      const servicesJson = body.services && body.services.length > 0 
        ? JSON.stringify(body.services) 
        : null;
      const hourlyRateCents = body.hourlyRateEur 
        ? Math.round(body.hourlyRateEur * 100) 
        : null;

      await db.execute({
        sql: `UPDATE ProfileCaregiver 
              SET title = ?, bio = ?, city = ?, experienceYears = ?, 
                  services = ?, hourlyRateEur = ?, certifications = ?, languages = ?,
                  updatedAt = CURRENT_TIMESTAMP 
              WHERE userId = ?`,
        args: [
          body.title || '',
          body.bio || '',
          body.city || '',
          body.experienceYears || 0,
          servicesJson,
          hourlyRateCents || 1500,
          body.certifications || '',
          body.languages || '',
          userId
        ]
      });
    }

    if (isFamily) {
      await db.execute({
        sql: `UPDATE ProfileFamily 
              SET city = ?, elderName = ?, elderAge = ?,
                  emergencyContactName = ?, emergencyContactPhone = ?,
                  updatedAt = CURRENT_TIMESTAMP 
              WHERE userId = ?`,
        args: [
          body.city || '',
          body.elderName || '',
          body.elderAge || null,
          body.emergencyContact || '',
          body.emergencyPhone || '',
          userId
        ]
      });
    }

    return NextResponse.json({ success: true, message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create/update caregiver profile during setup
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      profileType,
      title,
      bio,
      experienceYears,
      services,
      hourlyRateEur,
      availability,
      city,
      certifications,
      languages,
    } = body;

    const userId = session.user.id;

    if (profileType !== 'caregiver') {
      return NextResponse.json({ error: 'Invalid profile type' }, { status: 400 });
    }

    // Check if profile already exists
    const existingProfile = await db.execute({
      sql: `SELECT id FROM ProfileCaregiver WHERE userId = ?`,
      args: [userId]
    });

    const servicesJson = services && services.length > 0 ? JSON.stringify(services) : null;
    const availabilityJson = availability && availability.length > 0 ? JSON.stringify(availability) : null;

    if (existingProfile.rows.length > 0) {
      // Update existing profile
      await db.execute({
        sql: `UPDATE ProfileCaregiver 
              SET title = ?, bio = ?, experienceYears = ?, services = ?, 
                  hourlyRateEur = ?, availabilityJson = ?, city = ?,
                  certifications = ?, languages = ?, updatedAt = CURRENT_TIMESTAMP
              WHERE userId = ?`,
        args: [
          title || '',
          bio || '',
          experienceYears || 0,
          servicesJson,
          hourlyRateEur || 1500,
          availabilityJson,
          city || '',
          certifications || '',
          languages || '',
          userId
        ]
      });
    } else {
      // Create new profile
      const profileId = crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO ProfileCaregiver (
                id, userId, title, bio, experienceYears, services, 
                hourlyRateEur, availabilityJson, city, certifications, languages,
                verificationStatus, totalContracts, totalHoursWorked, averageRating, totalReviews,
                createdAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNVERIFIED', 0, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [
          profileId,
          userId,
          title || '',
          bio || '',
          experienceYears || 0,
          servicesJson,
          hourlyRateEur || 1500,
          availabilityJson,
          city || '',
          certifications || '',
          languages || ''
        ]
      });
    }

    // Update user status to indicate profile is complete
    await db.execute({
      sql: `UPDATE User SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [userId]
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Profile created successfully',
      profileComplete: true 
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
