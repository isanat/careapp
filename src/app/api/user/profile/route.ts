import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-turso';
import { db } from '@/lib/db-turso';

export async function GET(request: NextRequest) {
  console.log('📥 GET /api/user/profile - Iniciando');
  
  try {
    const session = await getServerSession(authOptions);
    console.log('📋 Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - no session or user id');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const isCaregiver = session.user.role === 'CAREGIVER';
    const isFamily = session.user.role === 'FAMILY';
    
    console.log(`👤 User ID: ${userId}, Role: ${session.user.role}, isCaregiver: ${isCaregiver}, isFamily: ${isFamily}`);

    // Get basic user info with all new fields
    console.log('🔍 Buscando usuário no banco...');
    const userResult = await db.execute({
      sql: `SELECT id, email, name, phone, role, status, profileImage, 
                   nif, documentType, documentNumber,
                   backgroundCheckStatus, backgroundCheckUrl,
                   createdAt 
            FROM User WHERE id = ?`,
      args: [userId]
    });

    console.log(`📊 Resultado da busca: ${userResult.rows.length} linhas`);

    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    console.log('👤 Dados do usuário:', JSON.stringify(user, null, 2));

    // Get profile based on role
    let profile: Record<string, any> = null;

    if (isCaregiver) {
      console.log('🔍 Buscando ProfileCaregiver...');
      const profileResult = await db.execute({
        sql: `SELECT id, title, bio, experienceYears, city, services, 
                     hourlyRateEur, averageRating, totalReviews, totalContracts,
                     certifications, languages
              FROM ProfileCaregiver WHERE userId = ?`,
        args: [userId]
      });

      console.log(`📊 ProfileCaregiver: ${profileResult.rows.length} linhas`);

      if (profileResult.rows.length > 0) {
        const row = profileResult.rows[0];
        console.log('📋 Dados do ProfileCaregiver:', JSON.stringify(row, null, 2));
        
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
      } else {
        console.log('⚠️ ProfileCaregiver não encontrado - criando perfil vazio...');
        // Criar perfil vazio para o cuidador
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
          console.log('✅ ProfileCaregiver criado com sucesso');
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
          console.error('❌ Erro ao criar ProfileCaregiver:', e);
        }
      }
    }

    if (isFamily) {
      console.log('🔍 Buscando ProfileFamily...');
      const profileResult = await db.execute({
        sql: `SELECT id, city, elderName, elderAge, emergencyContactName, emergencyContactPhone
              FROM ProfileFamily WHERE userId = ?`,
        args: [userId]
      });

      console.log(`📊 ProfileFamily: ${profileResult.rows.length} linhas`);

      if (profileResult.rows.length > 0) {
        const row = profileResult.rows[0];
        console.log('📋 Dados do ProfileFamily:', JSON.stringify(row, null, 2));
        profile = {
          city: row.city,
          elderName: row.elderName,
          elderAge: row.elderAge,
          emergencyContact: row.emergencyContactName,
          emergencyPhone: row.emergencyContactPhone,
        };
      } else {
        console.log('⚠️ ProfileFamily não encontrado - criando perfil vazio...');
        // Criar perfil vazio para a família
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
          console.log('✅ ProfileFamily criado com sucesso');
          profile = {
            city: '',
            elderName: '',
            elderAge: null,
            emergencyContact: '',
            emergencyPhone: '',
          };
        } catch (e) {
          console.error('❌ Erro ao criar ProfileFamily:', e);
        }
      }
    }

    // Get wallet info
    console.log('🔍 Buscando Wallet...');
    const walletResult = await db.execute({
      sql: `SELECT address, balanceTokens, balanceEurCents FROM Wallet WHERE userId = ?`,
      args: [userId]
    });

    console.log(`📊 Wallet: ${walletResult.rows.length} linhas`);

    const wallet = walletResult.rows.length > 0 ? {
      address: walletResult.rows[0].address,
      balanceTokens: walletResult.rows[0].balanceTokens,
      balanceEurCents: walletResult.rows[0].balanceEurCents,
    } : null;

    const responseData = {
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
    };
    
    console.log('📤 Retornando dados:', JSON.stringify(responseData, null, 2));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  console.log('📝 PUT /api/user/profile - Iniciando');
  
  try {
    const session = await getServerSession(authOptions);
    console.log('📋 Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - no session or user id');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📦 Body recebido:', JSON.stringify(body, null, 2));
    
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
      
      console.log('📝 Atualizando User:', { updates: userUpdates, args: userArgs });
      
      const result = await db.execute({
        sql: `UPDATE User SET ${userUpdates.join(', ')} WHERE id = ?`,
        args: userArgs
      });
      
      console.log('✅ User atualizado:', result.rowsAffected, 'linhas afetadas');
    } else {
      console.log('⚠️ Nenhum campo de User para atualizar');
    }

    // Update profile based on role
    if (isCaregiver && (
      body.title !== undefined ||
      body.bio !== undefined ||
      body.city !== undefined ||
      body.experienceYears !== undefined ||
      body.services !== undefined ||
      body.hourlyRateEur !== undefined ||
      body.certifications !== undefined ||
      body.languages !== undefined
    )) {
      const servicesJson = body.services && body.services.length > 0 
        ? JSON.stringify(body.services) 
        : null;
      const hourlyRateCents = body.hourlyRateEur 
        ? Math.round(body.hourlyRateEur * 100) 
        : null;

      console.log('📝 Atualizando ProfileCaregiver...');

      const result = await db.execute({
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
          body.experienceYears ?? null,
          servicesJson,
          hourlyRateCents,
          body.certifications ?? null,
          body.languages ?? null,
          userId
        ]
      });
      
      console.log('✅ ProfileCaregiver atualizado:', result.rowsAffected, 'linhas afetadas');
    }

    if (isFamily && (
      body.city !== undefined ||
      body.elderName !== undefined ||
      body.elderAge !== undefined ||
      body.emergencyContact !== undefined ||
      body.emergencyPhone !== undefined ||
      body.elderNeeds !== undefined
    )) {
      console.log('📝 Atualizando ProfileFamily...');
      
      const result = await db.execute({
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
          body.elderAge ?? null,
          body.emergencyContact ?? null,
          body.emergencyPhone ?? null,
          body.elderNeeds ?? null,
          userId
        ]
      });
      
      console.log('✅ ProfileFamily atualizado:', result.rowsAffected, 'linhas afetadas');
    }

    console.log('🎉 Perfil atualizado com sucesso');
    return NextResponse.json({ success: true, message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
  }
}

// POST: Create/update caregiver profile during setup
export async function POST(request: NextRequest) {
  console.log('📝 POST /api/user/profile - Iniciando');
  
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
