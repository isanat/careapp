-- IdosoLink Database Schema for Turso
-- Complete schema with all tables

-- ==================== USERS ====================
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

-- ==================== WALLETS ====================
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

-- ==================== PROFILES ====================
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
  mobility_level TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  preferred_services TEXT,
  preferred_schedule TEXT,
  budget_range TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profiles_caregiver (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  title TEXT,
  bio TEXT,
  experience_years INTEGER,
  education TEXT,
  certifications TEXT,
  languages TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'PT',
  latitude REAL,
  longitude REAL,
  radius_km INTEGER DEFAULT 20,
  services TEXT,
  hourly_rate_eur INTEGER DEFAULT 1500,
  minimum_hours INTEGER DEFAULT 2,
  availability_json TEXT,
  available_now INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'UNVERIFIED',
  document_type TEXT,
  document_number TEXT,
  document_verified INTEGER DEFAULT 0,
  background_check_status TEXT,
  total_contracts INTEGER DEFAULT 0,
  total_hours_worked INTEGER DEFAULT 0,
  average_rating REAL DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  profile_image TEXT,
  portfolio_images TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== TOKEN LEDGER ====================
CREATE TABLE IF NOT EXISTS token_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  reason TEXT NOT NULL,
  amount_tokens INTEGER NOT NULL,
  amount_eur_cents INTEGER NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  tx_hash TEXT,
  description TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== CONTRACTS ====================
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  family_user_id TEXT NOT NULL,
  caregiver_user_id TEXT NOT NULL,
  status TEXT DEFAULT 'DRAFT',
  title TEXT,
  description TEXT,
  tasks_json TEXT,
  service_types TEXT,
  hours_per_week INTEGER,
  schedule_json TEXT,
  hourly_rate_eur INTEGER NOT NULL,
  total_hours INTEGER,
  total_eur_cents INTEGER,
  platform_fee_pct INTEGER DEFAULT 10,
  start_date TEXT,
  end_date TEXT,
  family_fee_tokens INTEGER DEFAULT 0,
  caregiver_fee_tokens INTEGER DEFAULT 0,
  family_fee_paid INTEGER DEFAULT 0,
  caregiver_fee_paid INTEGER DEFAULT 0,
  accepted_by_family_at TEXT,
  accepted_by_caregiver_at TEXT,
  onchain_hash TEXT,
  onchain_tx_hash TEXT,
  onchain_created_at TEXT,
  total_paid_eur_cents INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  cancelled_at TEXT,
  FOREIGN KEY (family_user_id) REFERENCES users(id),
  FOREIGN KEY (caregiver_user_id) REFERENCES users(id)
);

-- ==================== CONTRACT ACCEPTANCE ====================
CREATE TABLE IF NOT EXISTS contract_acceptance (
  id TEXT PRIMARY KEY,
  contract_id TEXT UNIQUE NOT NULL,
  accepted_by_family_at TEXT,
  family_ip_address TEXT,
  family_user_agent TEXT,
  accepted_by_caregiver_at TEXT,
  caregiver_ip_address TEXT,
  caregiver_user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);

-- ==================== PAYMENTS ====================
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  provider TEXT DEFAULT 'STRIPE',
  amount_eur_cents INTEGER NOT NULL,
  tokens_amount INTEGER DEFAULT 0,
  platform_fee INTEGER DEFAULT 0,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  contract_id TEXT,
  description TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  paid_at TEXT,
  refunded_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (contract_id) REFERENCES contracts(id)
);

-- ==================== REVIEWS ====================
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  punctuality_rating INTEGER,
  professionalism_rating INTEGER,
  communication_rating INTEGER,
  quality_rating INTEGER,
  is_public INTEGER DEFAULT 1,
  is_moderated INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id)
);

-- ==================== TIPS ====================
CREATE TABLE IF NOT EXISTS tips (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  amount_tokens INTEGER NOT NULL,
  amount_eur_cents INTEGER NOT NULL,
  message TEXT,
  tx_hash TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id)
);

-- ==================== CHAT ====================
CREATE TABLE IF NOT EXISTS chat_rooms (
  id TEXT PRIMARY KEY,
  type TEXT DEFAULT 'direct',
  reference_type TEXT,
  reference_id TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_participants (
  id TEXT PRIMARY KEY,
  chat_room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  last_read_at TEXT,
  unread_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(chat_room_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  chat_room_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  metadata TEXT,
  is_edited INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- ==================== NOTIFICATIONS ====================
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  is_read INTEGER DEFAULT 0,
  read_at TEXT,
  email_sent INTEGER DEFAULT 0,
  push_sent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== PLATFORM SETTINGS (FOR ADMIN) ====================
CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY,
  activation_cost_eur_cents INTEGER DEFAULT 3500,
  contract_fee_eur_cents INTEGER DEFAULT 500,
  platform_fee_percent INTEGER DEFAULT 10,
  token_price_eur_cents INTEGER DEFAULT 1,
  total_reserve_eur_cents INTEGER DEFAULT 0,
  total_tokens_minted INTEGER DEFAULT 0,
  total_tokens_burned INTEGER DEFAULT 0,
  senior_token_address TEXT,
  contract_registry_address TEXT,
  stripe_webhook_secret TEXT,
  maintenance_mode INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ==================== AUTH (NextAuth) ====================
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  expires TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(identifier, token)
);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_token_ledger_user ON token_ledger(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_contracts_family ON contracts(family_user_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_caregiver ON contracts(caregiver_user_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(chat_room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_to_user ON reviews(to_user_id, created_at);
