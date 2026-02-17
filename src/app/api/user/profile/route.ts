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
      sql: `SELECT id, email, name, role, status, profile_image, created_at 
            FROM users WHERE id = ?`,
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
        sql: `SELECT id, title, bio, experience_years, city, services, 
                     hourly_rate_eur, average_rating, total_reviews, total_contracts
              FROM profiles_caregiver WHERE user_id = ?`,
        args: [userId]
      });

      if (profileResult.rows.length > 0) {
        profile = {
          title: profileResult.rows[0].title,
          bio: profileResult.rows[0].bio,
          experienceYears: profileResult.rows[0].experience_years,
          city: profileResult.rows[0].city,
          services: profileResult.rows[0].services ? 
            String(profileResult.rows[0].services).split(',') : [],
          hourlyRateEur: profileResult.rows[0].hourly_rate_eur,
          averageRating: profileResult.rows[0].average_rating,
          totalReviews: profileResult.rows[0].total_reviews,
          totalContracts: profileResult.rows[0].total_contracts,
        };
      }
    } else {
      const profileResult = await db.execute({
        sql: `SELECT id, city, elder_name, elder_age, emergency_contact_name, emergency_contact_phone
              FROM profiles_family WHERE user_id = ?`,
        args: [userId]
      });

      if (profileResult.rows.length > 0) {
        profile = {
          city: profileResult.rows[0].city,
          elderName: profileResult.rows[0].elder_name,
          elderAge: profileResult.rows[0].elder_age,
          emergencyContact: profileResult.rows[0].emergency_contact_name,
          emergencyPhone: profileResult.rows[0].emergency_contact_phone,
        };
      }
    }

    // Get wallet info
    const walletResult = await db.execute({
      sql: `SELECT address, balance_tokens FROM wallets WHERE user_id = ?`,
      args: [userId]
    });

    const wallet = walletResult.rows.length > 0 ? {
      address: walletResult.rows[0].address,
      balanceTokens: walletResult.rows[0].balance_tokens,
    } : null;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        profileImage: user.profile_image,
        createdAt: user.created_at,
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
        sql: `UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [name, userId]
      });
    }

    // Update profile based on role
    if (isCaregiver && profileData.title) {
      await db.execute({
        sql: `UPDATE profiles_caregiver 
              SET title = ?, bio = ?, city = ?, updated_at = CURRENT_TIMESTAMP 
              WHERE user_id = ?`,
        args: [profileData.title, profileData.bio || '', profileData.city || '', userId]
      });
    }

    return NextResponse.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
