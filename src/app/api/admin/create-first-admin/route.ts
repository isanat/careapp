import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db-turso';
import { randomUUID } from 'crypto';

/**
 * API para criar o primeiro usuário admin
 * USE APENAS UMA VEZ após o deploy!
 * 
 * Segredo: idosolink-admin-2024
 */

export async function POST(request: NextRequest) {
  try {
    // Verificar segredo de admin
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'idosolink-admin-2024') {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid secret' },
        { status: 401 }
      );
    }

    // Verificar se já existe algum admin
    const existingAdmins = await db.execute({
      sql: `SELECT COUNT(*) as count FROM User WHERE role = 'ADMIN'`,
      args: []
    });

    const adminCount = (existingAdmins.rows[0] as any)?.count || 0;

    // Verificar se a tabela AdminUser existe
    const tablesCheck = await db.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' AND name='AdminUser'`,
      args: []
    });

    if (tablesCheck.rows.length === 0) {
      return NextResponse.json({
        error: 'AdminUser table does not exist. Run /api/admin/migrate-admin first',
      }, { status: 400 });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash('admin123', 10);
    const userId = randomUUID();
    const adminProfileId = randomUUID();
    const now = new Date().toISOString();

    // Criar usuário admin
    await db.execute({
      sql: `
        INSERT OR REPLACE INTO User (id, email, name, passwordHash, role, status, emailVerified, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [userId, 'admin@idosolink.com', 'Admin IdosoLink', passwordHash, 'ADMIN', 'ACTIVE', now, now, now]
    });

    // Criar perfil AdminUser
    await db.execute({
      sql: `
        INSERT OR REPLACE INTO AdminUser (id, userId, role, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [adminProfileId, userId, 'SUPER_ADMIN', 1, now, now]
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      credentials: {
        email: 'admin@idosolink.com',
        password: 'admin123'
      },
      userId,
      adminProfileId,
      previousAdminCount: adminCount,
    });

  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({
      error: 'Failed to create admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET para verificar status
export async function GET(request: NextRequest) {
  try {
    const tablesCheck = await db.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('User', 'AdminUser')`,
      args: []
    });

    const existingTables = tablesCheck.rows.map((row: any) => row.name);

    let adminCount = 0;
    let superAdminCount = 0;

    if (existingTables.includes('User')) {
      const countResult = await db.execute({
        sql: `SELECT COUNT(*) as count FROM User WHERE role = 'ADMIN'`,
        args: []
      });
      adminCount = (countResult.rows[0] as any)?.count || 0;
    }

    if (existingTables.includes('AdminUser')) {
      const countResult = await db.execute({
        sql: `SELECT COUNT(*) as count FROM AdminUser WHERE role = 'SUPER_ADMIN'`,
        args: []
      });
      superAdminCount = (countResult.rows[0] as any)?.count || 0;
    }

    return NextResponse.json({
      tablesExist: existingTables,
      adminCount,
      superAdminCount,
      canCreateAdmin: existingTables.includes('User') && existingTables.includes('AdminUser'),
      instructions: adminCount === 0 
        ? 'POST to this endpoint with header x-admin-secret: idosolink-admin-2024 to create admin'
        : 'Admin already exists'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
