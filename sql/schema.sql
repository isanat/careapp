-- IdosoLink Database Schema for Turso
-- Run this to create the database schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'FAMILY',
  status TEXT DEFAULT 'PENDING',
  email_verified INTEGER DEFAULT 0,
  phone_verified INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'UNVERIFIED',
  profile_image TEXT,
  preferred_language TEXT DEFAULT 'pt',
  timezone TEXT DEFAULT 'Europe/Lisbon',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  address TEXT UNIQUE NOT NULL,
  encrypted_private_key TEXT,
  salt TEXT,
  balance_tokens INTEGER DEFAULT 0,
  balance_eur_cents INTEGER DEFAULT 0,
  wallet_type TEXT DEFAULT 'custodial',
  is_exported INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Profile Family
CREATE TABLE IF NOT EXISTS profiles_family (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'PT',
  latitude REAL,
  longitude REAL,
  elder_name TEXT,
  elder_age INTEGER,
  elder_needs TEXT,
  medical_conditions TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Profile Caregiver
CREATE TABLE IF NOT EXISTS profiles_caregiver (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  title TEXT,
  bio TEXT,
  experience_years INTEGER,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'PT',
  services TEXT,
  hourly_rate_eur INTEGER DEFAULT 1500,
  total_contracts INTEGER DEFAULT 0,
  total_hours_worked INTEGER DEFAULT 0,
  average_rating REAL DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  family_user_id TEXT NOT NULL,
  caregiver_user_id TEXT NOT NULL,
  status TEXT DEFAULT 'DRAFT',
  title TEXT,
  description TEXT,
  hourly_rate_eur INTEGER NOT NULL,
  total_hours INTEGER,
  total_eur_cents INTEGER,
  start_date TEXT,
  end_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_user_id) REFERENCES users(id),
  FOREIGN KEY (caregiver_user_id) REFERENCES users(id)
);

-- Sessions (for NextAuth)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  expires TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Accounts (for NextAuth OAuth)
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, provider_account_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
