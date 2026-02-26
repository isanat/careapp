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

    // Get basic user info
    const userResult = await db.execute({
      sql: `SELECT id, email, name, role, status, profileImage, createdAt 
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
                     hourlyRateEur, averageRating, totalReviews, totalContracts
              FROM ProfileCaregiver WHERE userId = ?`,
        args: [userId]
      });

      if (profileResult.rows.length > 0) {
        profile = {
          title: profileResult.rows[0].title,
          bio: profileResult.rows[0].bio,
          experienceYears: profileResult.rows[0].experienceYears,
          city: profileResult.rows[0].city,
          services: profileResult.rows[0].services ? 
            String(profileResult.rows[0].services).split(',') : [],
          hourlyRateEur: profileResult.rows[0].hourlyRateEur,
          averageRating: profileResult.rows[0].averageRating,
          totalReviews: profileResult.rows[0].totalReviews,
          totalContracts: profileResult.rows[0].totalContracts,
        };
      }
    } else {
      const profileResult = await db.execute({
        sql: `SELECT id, city, elderName, elderAge, emergencyContactName, emergencyContactPhone
              FROM ProfileFamily WHERE userId = ?`,
        args: [userId]
      });

      if (profileResult.rows.length > 0) {
        profile = {
          city: profileResult.rows[0].city,
          elderName: profileResult.rows[0].elderName,
          elderAge: profileResult.rows[0].elderAge,
          emergencyContact: profileResult.rows[0].emergencyContactName,
          emergencyPhone: profileResult.rows[0].emergencyContactPhone,
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
    const { name, phone, ...profileData } = body;
    const userId = session.user.id;
    const isCaregiver = session.user.role === 'CAREGIVER';

    // Update user basic info
    if (name) {
      await db.execute({
        sql: `UPDATE User SET name = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [name, userId]
      });
    }

    // Update profile based on role
    if (isCaregiver && profileData.title) {
      await db.execute({
        sql: `UPDATE ProfileCaregiver 
              SET title = ?, bio = ?, city = ?, updatedAt = CURRENT_TIMESTAMP 
              WHERE userId = ?`,
        args: [profileData.title, profileData.bio || '', profileData.city || '', userId]
      });
    }

    return NextResponse.json({ success: true, message: 'Profile updated' });
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
