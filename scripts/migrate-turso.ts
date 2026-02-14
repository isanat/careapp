import { createClient } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

async function migrateTurso() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  console.log('📦 Running migrations on Turso...');

  // Create users table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT,
      role TEXT DEFAULT 'FAMILY',
      status TEXT DEFAULT 'PENDING',
      email_verified INTEGER DEFAULT 0,
      verification_status TEXT DEFAULT 'UNVERIFIED',
      profile_image TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT
    )
  `);
  console.log('✅ Users table created');

  // Create wallets table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      address TEXT UNIQUE NOT NULL,
      balance_tokens INTEGER DEFAULT 0,
      balance_eur_cents INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Wallets table created');

  // Create profiles_caregiver table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS profiles_caregiver (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      title TEXT,
      bio TEXT,
      experience_years INTEGER,
      city TEXT,
      services TEXT,
      hourly_rate_eur INTEGER DEFAULT 1500,
      average_rating REAL DEFAULT 0,
      total_reviews INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Profiles caregiver table created');

  // Create profiles_family table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS profiles_family (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      city TEXT,
      elder_name TEXT,
      elder_age INTEGER,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Profiles family table created');

  // Create sessions table for NextAuth
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      session_token TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      expires TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Sessions table created');

  // Create accounts table for NextAuth OAuth
  await db.execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      access_token TEXT,
      expires_at INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(provider, provider_account_id)
    )
  `);
  console.log('✅ Accounts table created');

  // Create indexes
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)`);

  console.log('\n👤 Creating demo users...');
  
  const passwordHash = await bcrypt.hash('teste123', 10);
  
  // Create demo family user
  try {
    await db.execute({
      sql: `INSERT INTO users (id, email, name, password_hash, role, status, verification_status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: ['demo-family-1', 'familia@teste.com', 'Maria Silva', passwordHash, 'FAMILY', 'ACTIVE', 'VERIFIED']
    });
    
    await db.execute({
      sql: `INSERT INTO wallets (id, user_id, address, balance_tokens) VALUES (?, ?, ?, ?)`,
      args: ['wallet-1', 'demo-family-1', '0x7a3d2c4e8f1b5a6d9c3e7f2a4b8d1c6e5f9a2b3c', 2500]
    });
    
    console.log('✅ Demo family user created: familia@teste.com');
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint')) {
      console.log('ℹ️ Family user already exists');
    } else {
      console.error('Error creating family user:', error.message);
    }
  }
  
  // Create demo caregiver user
  try {
    await db.execute({
      sql: `INSERT INTO users (id, email, name, password_hash, role, status, verification_status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: ['demo-caregiver-1', 'cuidador@teste.com', 'Ana Cuidadora', passwordHash, 'CAREGIVER', 'ACTIVE', 'VERIFIED']
    });
    
    await db.execute({
      sql: `INSERT INTO wallets (id, user_id, address, balance_tokens) VALUES (?, ?, ?, ?)`,
      args: ['wallet-2', 'demo-caregiver-1', '0x8b4e3d5f9a2c1e7d6b5a4c3f2e1d9c8b7a6f5e4d', 1500]
    });
    
    await db.execute({
      sql: `INSERT INTO profiles_caregiver (id, user_id, title, bio, experience_years, city, services, hourly_rate_eur, average_rating, total_reviews) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['profile-1', 'demo-caregiver-1', 'Enfermeira', 'Profissional com 10 anos de experiência em cuidados geriátricos.', 10, 'Lisboa', 'Cuidados Pessoais,Medicação,Companhia', 2500, 4.9, 32]
    });
    
    console.log('✅ Demo caregiver user created: cuidador@teste.com');
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint')) {
      console.log('ℹ️ Caregiver user already exists');
    } else {
      console.error('Error creating caregiver user:', error.message);
    }
  }

  console.log('\n🎉 Turso database is ready!');
  console.log('\nTest users:');
  console.log('  - familia@teste.com / teste123');
  console.log('  - cuidador@teste.com / teste123');
}

migrateTurso().catch(console.error);
