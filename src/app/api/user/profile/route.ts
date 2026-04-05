import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

// GET: Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and their profile
    const userResult = await db.execute({
      sql: `SELECT u.*, pf.*, pc.*
            FROM User u
            LEFT JOIN ProfileFamily pf ON u.id = pf.userId
            LEFT JOIN ProfileCaregiver pc ON u.id = pc.userId
            WHERE u.id = ?`,
      args: [session.user.id]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        profileImage: user.profileImage,
        nif: user.nif,
      },
      profileFamily: user.role === 'FAMILY' ? {
        address: user.address,
        city: user.city,
        country: user.country,
        elderName: user.elderName,
        elderAge: user.elderAge,
        elderNeeds: user.elderNeeds,
        medicalConditions: user.medicalConditions,
      } : null,
      profileCaregiver: user.role === 'CAREGIVER' ? {
        title: user.title,
        bio: user.bio,
        experienceYears: user.experienceYears,
        education: user.education,
        certifications: user.certifications,
        languages: user.languages,
        address: user.address,
        city: user.city,
        country: user.country,
        hourlyRateEur: user.hourlyRateEur,
        minimumHours: user.minimumHours,
        services: user.services,
        availableNow: user.availableNow,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      profileImage,
      address,
      city,
      country,
      elderName,
      elderAge,
      elderNeeds,
      title,
      bio,
      experienceYears,
      services,
      hourlyRateEur,
    } = body;

    const now = new Date().toISOString();

    // Update user basic info
    if (name || phone || profileImage) {
      const updates: string[] = [];
      const values: any[] = [];

      if (name) {
        updates.push('name = ?');
        values.push(name);
      }
      if (phone) {
        updates.push('phone = ?');
        values.push(phone);
      }
      if (profileImage) {
        updates.push('profileImage = ?');
        values.push(profileImage);
      }

      updates.push('updatedAt = ?');
      values.push(now);
      values.push(session.user.id);

      await db.execute({
        sql: `UPDATE User SET ${updates.join(', ')} WHERE id = ?`,
        args: values
      });
    }

    // Update family profile
    if (address !== undefined || city !== undefined || country !== undefined || elderName !== undefined || elderAge !== undefined || elderNeeds !== undefined) {
      const updates: string[] = [];
      const values: any[] = [];

      if (address !== undefined) {
        updates.push('address = ?');
        values.push(address);
      }
      if (city !== undefined) {
        updates.push('city = ?');
        values.push(city);
      }
      if (country !== undefined) {
        updates.push('country = ?');
        values.push(country);
      }
      if (elderName !== undefined) {
        updates.push('elderName = ?');
        values.push(elderName);
      }
      if (elderAge !== undefined) {
        updates.push('elderAge = ?');
        values.push(elderAge);
      }
      if (elderNeeds !== undefined) {
        updates.push('elderNeeds = ?');
        values.push(elderNeeds);
      }

      updates.push('updatedAt = ?');
      values.push(now);
      values.push(session.user.id);

      await db.execute({
        sql: `UPDATE ProfileFamily SET ${updates.join(', ')} WHERE userId = ?`,
        args: values
      });
    }

    // Update caregiver profile
    if (title !== undefined || bio !== undefined || experienceYears !== undefined || services !== undefined || hourlyRateEur !== undefined) {
      const updates: string[] = [];
      const values: any[] = [];

      if (title !== undefined) {
        updates.push('title = ?');
        values.push(title);
      }
      if (bio !== undefined) {
        updates.push('bio = ?');
        values.push(bio);
      }
      if (experienceYears !== undefined) {
        updates.push('experienceYears = ?');
        values.push(experienceYears);
      }
      if (services !== undefined) {
        updates.push('services = ?');
        values.push(JSON.stringify(services));
      }
      if (hourlyRateEur !== undefined) {
        updates.push('hourlyRateEur = ?');
        values.push(hourlyRateEur);
      }

      updates.push('updatedAt = ?');
      values.push(now);
      values.push(session.user.id);

      await db.execute({
        sql: `UPDATE ProfileCaregiver SET ${updates.join(', ')} WHERE userId = ?`,
        args: values
      });
    }

    return NextResponse.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
