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

    // Get basic user info (with fallback for missing columns)
    let userResult;
    try {
      userResult = await db.execute({
        sql: `SELECT id, email, name, phone, role, status, profileImage,
                     nif, documentType, documentNumber,
                     backgroundCheckStatus, backgroundCheckUrl,
                     createdAt
              FROM User WHERE id = ?`,
        args: [userId]
      });
    } catch {
      // Fallback if newer columns don't exist yet
      userResult = await db.execute({
        sql: `SELECT id, email, name, phone, role, status, profileImage, createdAt
              FROM User WHERE id = ?`,
        args: [userId]
      });
    }

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Get profile based on role
    let profile: Record<string, any> | null = null;

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

        let services: string[] = [];
        try {
          if (row.services) {
            services = typeof row.services === 'string'
              ? JSON.parse(row.services)
              : row.services;
          }
        } catch {
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
      } else {
        // Create empty caregiver profile
        const profileId = crypto.randomUUID();
        try {
          await db.execute({
            sql: `INSERT INTO ProfileCaregiver (
                    id, userId, title, bio, experienceYears, services,
                    hourlyRateEur, city, certifications, languages,
                    verificationStatus, totalContracts, totalHoursWorked, averageRating, totalReviews,
                    createdAt, updatedAt
                  ) VALUES (?, ?, '', '', 0, NULL, 1500, '', '', '', 'UNVERIFIED', 0, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            args: [profileId, userId]
          });
          profile = {
            title: '',
            bio: '',
            experienceYears: 0,
            city: '',
            services: [],
            hourlyRateEur: 1500,
            averageRating: 0,
            totalReviews: 0,
            totalContracts: 0,
            certifications: '',
            languages: '',
          };
        } catch (e) {
          console.error('Error creating ProfileCaregiver:', e);
        }
      }
    }

    if (isFamily) {
      const profileResult = await db.execute({
        sql: `SELECT id, city, elderName, elderAge, elderNeeds, emergencyContactName, emergencyContactPhone
              FROM ProfileFamily WHERE userId = ?`,
        args: [userId]
      });

      if (profileResult.rows.length > 0) {
        const row = profileResult.rows[0];
        profile = {
          city: row.city,
          elderName: row.elderName,
          elderAge: row.elderAge,
          elderNeeds: row.elderNeeds,
          emergencyContact: row.emergencyContactName,
          emergencyPhone: row.emergencyContactPhone,
        };
      } else {
        // Create empty family profile
        const profileId = crypto.randomUUID();
        try {
          await db.execute({
            sql: `INSERT INTO ProfileFamily (
                    id, userId, city, elderName, elderAge,
                    emergencyContactName, emergencyContactPhone,
                    createdAt, updatedAt
                  ) VALUES (?, ?, '', '', NULL, '', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            args: [profileId, userId]
          });
          profile = {
            city: '',
            elderName: '',
            elderAge: null,
            elderNeeds: '',
            emergencyContact: '',
            emergencyPhone: '',
          };
        } catch (e) {
          console.error('Error creating ProfileFamily:', e);
        }
      }
    }

    // Get wallet info
    const walletResult = await db.execute({
      sql: `SELECT address, balanceTokens, balanceEurCents FROM Wallet WHERE userId = ?`,
      args: [userId]
    });

    const wallet = walletResult.rows.length > 0 ? {
      address: walletResult.rows[0].address,
      balanceTokens: walletResult.rows[0].balanceTokens,
      balanceEurCents: walletResult.rows[0].balanceEurCents,
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
        nif: user.nif,
        documentType: user.documentType,
        documentNumber: user.documentNumber,
        backgroundCheckStatus: user.backgroundCheckStatus,
        backgroundCheckUrl: user.backgroundCheckUrl,
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

    // Build update query for User table
    const userUpdates: string[] = [];
    const userArgs: any[] = [];

    if (body.name !== undefined) {
      userUpdates.push('name = ?');
      userArgs.push(body.name);
    }
    if (body.phone !== undefined) {
      userUpdates.push('phone = ?');
      userArgs.push(body.phone);
    }
    if (body.profileImage !== undefined) {
      userUpdates.push('profileImage = ?');
      userArgs.push(body.profileImage);
    }
    if (body.nif !== undefined) {
      userUpdates.push('nif = ?');
      userArgs.push(body.nif);
    }
    if (body.documentType !== undefined) {
      userUpdates.push('documentType = ?');
      userArgs.push(body.documentType);
    }
    if (body.documentNumber !== undefined) {
      userUpdates.push('documentNumber = ?');
      userArgs.push(body.documentNumber);
    }
    if (body.backgroundCheckStatus !== undefined) {
      userUpdates.push('backgroundCheckStatus = ?');
      userArgs.push(body.backgroundCheckStatus);
    }
    if (body.backgroundCheckUrl !== undefined) {
      userUpdates.push('backgroundCheckUrl = ?');
      userArgs.push(body.backgroundCheckUrl);
    }

    if (userUpdates.length > 0) {
      userUpdates.push('updatedAt = CURRENT_TIMESTAMP');
      userArgs.push(userId);

      try {
        await db.execute({
          sql: `UPDATE User SET ${userUpdates.join(', ')} WHERE id = ?`,
          args: userArgs
        });
      } catch (dbError) {
        // If update fails (possibly due to missing columns), try with only basic fields
        console.warn('Full user update failed, trying basic fields:', dbError);
        const basicUpdates: string[] = [];
        const basicArgs: any[] = [];

        if (body.name !== undefined) { basicUpdates.push('name = ?'); basicArgs.push(body.name); }
        if (body.phone !== undefined) { basicUpdates.push('phone = ?'); basicArgs.push(body.phone); }
        if (body.profileImage !== undefined) { basicUpdates.push('profileImage = ?'); basicArgs.push(body.profileImage); }

        if (basicUpdates.length > 0) {
          basicUpdates.push('updatedAt = CURRENT_TIMESTAMP');
          basicArgs.push(userId);
          await db.execute({
            sql: `UPDATE User SET ${basicUpdates.join(', ')} WHERE id = ?`,
            args: basicArgs
          });
        }

        // Try to add missing columns and retry document fields
        const docColumns = [
          { name: 'nif', value: body.nif },
          { name: 'documentType', value: body.documentType },
          { name: 'documentNumber', value: body.documentNumber },
          { name: 'backgroundCheckStatus', value: body.backgroundCheckStatus },
          { name: 'backgroundCheckUrl', value: body.backgroundCheckUrl },
        ];
        for (const col of docColumns) {
          if (col.value !== undefined) {
            try {
              await db.execute({ sql: `ALTER TABLE User ADD COLUMN ${col.name} TEXT`, args: [] });
            } catch { /* column may already exist */ }
            try {
              await db.execute({
                sql: `UPDATE User SET ${col.name} = ? WHERE id = ?`,
                args: [col.value, userId]
              });
            } catch (e) {
              console.warn(`Failed to update ${col.name}:`, e);
            }
          }
        }
      }
    }

    // Update profile based on role
    if (isCaregiver) {
      const servicesJson = body.services && body.services.length > 0
        ? JSON.stringify(body.services)
        : null;
      const hourlyRateCents = body.hourlyRateEur
        ? Math.round(Number(body.hourlyRateEur) * 100)
        : null;

      try {
        await db.execute({
          sql: `UPDATE ProfileCaregiver
                SET title = COALESCE(?, title),
                    bio = COALESCE(?, bio),
                    city = COALESCE(?, city),
                    experienceYears = COALESCE(?, experienceYears),
                    services = COALESCE(?, services),
                    hourlyRateEur = COALESCE(?, hourlyRateEur),
                    certifications = COALESCE(?, certifications),
                    languages = COALESCE(?, languages),
                    updatedAt = CURRENT_TIMESTAMP
                WHERE userId = ?`,
          args: [
            body.title ?? null,
            body.bio ?? null,
            body.city ?? null,
            body.experienceYears != null ? Number(body.experienceYears) : null,
            servicesJson,
            hourlyRateCents,
            body.certifications ?? null,
            body.languages ?? null,
            userId
          ]
        });
      } catch (profileErr) {
        console.error('Error updating ProfileCaregiver:', profileErr);
      }
    }

    if (isFamily) {
      try {
        await db.execute({
          sql: `UPDATE ProfileFamily
                SET city = COALESCE(?, city),
                    elderName = COALESCE(?, elderName),
                    elderAge = COALESCE(?, elderAge),
                    emergencyContactName = COALESCE(?, emergencyContactName),
                    emergencyContactPhone = COALESCE(?, emergencyContactPhone),
                    elderNeeds = COALESCE(?, elderNeeds),
                    updatedAt = CURRENT_TIMESTAMP
                WHERE userId = ?`,
          args: [
            body.city ?? null,
            body.elderName ?? null,
            body.elderAge != null ? Number(body.elderAge) : null,
            body.emergencyContact ?? null,
            body.emergencyPhone ?? null,
            body.elderNeeds ?? null,
            userId
          ]
        });
      } catch (profileErr) {
        console.error('Error updating ProfileFamily:', profileErr);
      }
    }

    return NextResponse.json({ success: true, message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Error updating profile:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal server error', detail: message }, { status: 500 });
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
