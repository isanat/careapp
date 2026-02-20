import { createClient } from '@libsql/client';
import * as bcrypt from 'bcryptjs';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const SENT_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';
const CONTRACT_REGISTRY_ADDRESS = '0x0000000000000000000000000000000000000000';

async function setupTurso() {
  console.log('🚀 Setting up IdosoLink database on Turso...\n');

  try {
    // ==================== CREATE ALL TABLES ====================
    console.log('📦 Creating tables...');

    // 1. Users (no FK dependencies)
    await db.execute(`CREATE TABLE IF NOT EXISTS users (
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
    )`);
    console.log('  ✅ users');

    // 2. Wallets (depends on users)
    await db.execute(`CREATE TABLE IF NOT EXISTS wallets (
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
    )`);
    console.log('  ✅ wallets');

    // 3. Profiles Family (depends on users)
    await db.execute(`CREATE TABLE IF NOT EXISTS profiles_family (
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
    )`);
    console.log('  ✅ profiles_family');

    // 4. Profiles Caregiver (depends on users)
    await db.execute(`CREATE TABLE IF NOT EXISTS profiles_caregiver (
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
    )`);
    console.log('  ✅ profiles_caregiver');

    // 5. Token Ledger (depends on users)
    await db.execute(`CREATE TABLE IF NOT EXISTS token_ledger (
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
    )`);
    console.log('  ✅ token_ledger');

    // 6. Contracts (depends on users)
    await db.execute(`CREATE TABLE IF NOT EXISTS contracts (
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
    )`);
    console.log('  ✅ contracts');

    // 7. Payments (depends on users, contracts)
    await db.execute(`CREATE TABLE IF NOT EXISTS payments (
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
    )`);
    console.log('  ✅ payments');

    // 8. Contract Acceptance (depends on contracts)
    await db.execute(`CREATE TABLE IF NOT EXISTS contract_acceptance (
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
    )`);
    console.log('  ✅ contract_acceptance');

    // 8b. Terms Acceptances (depends on users)
    await db.execute(`CREATE TABLE IF NOT EXISTS terms_acceptances (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      terms_type TEXT NOT NULL,
      terms_version TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      accepted_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    console.log('  ✅ terms_acceptances');

    // 8c. Guide Acceptances (depends on users)
    await db.execute(`CREATE TABLE IF NOT EXISTS guide_acceptances (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      guide_type TEXT DEFAULT 'best_practices',
      guide_version TEXT DEFAULT '1.0',
      acknowledged_at TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    console.log('  ✅ guide_acceptances');

    // 8d. Escrow Payments (depends on contracts)
    await db.execute(`CREATE TABLE IF NOT EXISTS escrow_payments (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      payment_intent_id TEXT UNIQUE NOT NULL,
      total_amount_cents INTEGER NOT NULL,
      platform_fee_cents INTEGER NOT NULL,
      caregiver_amount_cents INTEGER NOT NULL,
      status TEXT DEFAULT 'HELD',
      family_customer_id TEXT,
      caregiver_account_id TEXT,
      transfer_id TEXT,
      platform_transfer_id TEXT,
      captured_at TEXT,
      released_at TEXT,
      refunded_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
    )`);
    console.log('  ✅ escrow_payments');

    // 9. Reviews (depends on contracts, users)
    await db.execute(`CREATE TABLE IF NOT EXISTS reviews (
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
    )`);
    console.log('  ✅ reviews');

    // 10. Tips (depends on contracts, users)
    await db.execute(`CREATE TABLE IF NOT EXISTS tips (
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
    )`);
    console.log('  ✅ tips');

    // 11. Chat Rooms (no FK dependencies)
    await db.execute(`CREATE TABLE IF NOT EXISTS chat_rooms (
      id TEXT PRIMARY KEY,
      type TEXT DEFAULT 'direct',
      reference_type TEXT,
      reference_id TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log('  ✅ chat_rooms');

    // 12. Chat Participants (depends on chat_rooms, users)
    await db.execute(`CREATE TABLE IF NOT EXISTS chat_participants (
      id TEXT PRIMARY KEY,
      chat_room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      last_read_at TEXT,
      unread_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(chat_room_id, user_id)
    )`);
    console.log('  ✅ chat_participants');

    // 13. Chat Messages (depends on chat_rooms, users)
    await db.execute(`CREATE TABLE IF NOT EXISTS chat_messages (
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
    )`);
    console.log('  ✅ chat_messages');

    // 14. Notifications (depends on users)
    await db.execute(`CREATE TABLE IF NOT EXISTS notifications (
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
    )`);
    console.log('  ✅ notifications');

    // 15. Platform Settings (no FK dependencies)
    await db.execute(`CREATE TABLE IF NOT EXISTS platform_settings (
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
    )`);
    console.log('  ✅ platform_settings');

    // 16. Sessions (depends on users)
    await db.execute(`CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      session_token TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      expires TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    console.log('  ✅ sessions');

    // 17. Accounts (depends on users)
    await db.execute(`CREATE TABLE IF NOT EXISTS accounts (
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
    )`);
    console.log('  ✅ accounts');

    // 18. Verification Tokens (no FK dependencies)
    await db.execute(`CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(identifier, token)
    )`);
    console.log('  ✅ verification_tokens');

    // Create indexes
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_token_ledger_user ON token_ledger(user_id, created_at)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_contracts_family ON contracts(family_user_id, status)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_contracts_caregiver ON contracts(caregiver_user_id, status)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(chat_room_id, created_at)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_terms_acceptances_user ON terms_acceptances(user_id, terms_type)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_guide_acceptances_user ON guide_acceptances(user_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_escrow_payments_contract ON escrow_payments(contract_id)`);
    console.log('  ✅ indexes');

    console.log('\n📊 All tables created!\n');

    // ==================== SEED DATA ====================
    console.log('🌱 Seeding data...');

    const passwordHash = await bcrypt.hash('teste123', 10);
    const now = new Date().toISOString();

    // Platform Settings
    await db.execute({
      sql: `INSERT OR REPLACE INTO platform_settings (id, activation_cost_eur_cents, contract_fee_eur_cents, platform_fee_percent, token_price_eur_cents, senior_token_address, contract_registry_address) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: ['settings-main', 3500, 500, 10, 1, SENT_TOKEN_ADDRESS, CONTRACT_REGISTRY_ADDRESS]
    });
    console.log('  ✅ Platform settings');

    // ==================== USERS ====================
    const users = [
      { id: 'cg-ana-silva', email: 'ana.silva@exemplo.com', name: 'Ana Silva', role: 'CAREGIVER' },
      { id: 'cg-maria-santos', email: 'maria.santos@exemplo.com', name: 'Maria Santos', role: 'CAREGIVER' },
      { id: 'cg-carla-oliveira', email: 'carla.oliveira@exemplo.com', name: 'Carla Oliveira', role: 'CAREGIVER' },
      { id: 'cg-tereza-costa', email: 'tereza.costa@exemplo.com', name: 'Tereza Costa', role: 'CAREGIVER' },
      { id: 'cg-lucia-ferreira', email: 'lucia.ferreira@exemplo.com', name: 'Lúcia Ferreira', role: 'CAREGIVER' },
      { id: 'cg-paulo-mendes', email: 'paulo.mendes@exemplo.com', name: 'Paulo Mendes', role: 'CAREGIVER' },
      { id: 'fm-joao-pereira', email: 'joao.pereira@exemplo.com', name: 'João Pereira', role: 'FAMILY' },
      { id: 'fm-paula-silva', email: 'paula.silva@exemplo.com', name: 'Paula Silva', role: 'FAMILY' },
      { id: 'fm-marcos-almeida', email: 'marcos.almeida@exemplo.com', name: 'Marcos Almeida', role: 'FAMILY' },
      { id: 'demo-family-1', email: 'familia@teste.com', name: 'Maria Silva', role: 'FAMILY' },
      { id: 'demo-caregiver-1', email: 'cuidador@teste.com', name: 'Ana Cuidadora', role: 'CAREGIVER' },
    ];

    for (const user of users) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO users (id, email, name, password_hash, role, status, verification_status, created_at) VALUES (?, ?, ?, ?, ?, 'ACTIVE', 'VERIFIED', ?)`,
        args: [user.id, user.email, user.name, passwordHash, user.role, now]
      });
    }
    console.log(`  ✅ ${users.length} users`);

    // ==================== WALLETS ====================
    const wallets = [
      { id: 'wallet-cg-ana-silva', userId: 'cg-ana-silva', address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b', balance: 5000 },
      { id: 'wallet-cg-maria-santos', userId: 'cg-maria-santos', address: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1', balance: 3200 },
      { id: 'wallet-cg-carla-oliveira', userId: 'cg-carla-oliveira', address: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2', balance: 4500 },
      { id: 'wallet-cg-tereza-costa', userId: 'cg-tereza-costa', address: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3', balance: 2100 },
      { id: 'wallet-cg-lucia-ferreira', userId: 'cg-lucia-ferreira', address: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4', balance: 1800 },
      { id: 'wallet-cg-paulo-mendes', userId: 'cg-paulo-mendes', address: '0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5', balance: 2800 },
      { id: 'wallet-fm-joao-pereira', userId: 'fm-joao-pereira', address: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6', balance: 5000 },
      { id: 'wallet-fm-paula-silva', userId: 'fm-paula-silva', address: '0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7', balance: 3500 },
      { id: 'wallet-fm-marcos-almeida', userId: 'fm-marcos-almeida', address: '0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8', balance: 8000 },
      { id: 'wallet-demo-family-1', userId: 'demo-family-1', address: '0x7a3d2c4e8f1b5a6d9c3e7f2a4b8d1c6e5f9a2b3c', balance: 2500 },
      { id: 'wallet-demo-caregiver-1', userId: 'demo-caregiver-1', address: '0x8b4e3d5f9a2c1e7d6b5a4c3f2e1d9c8b7a6f5e4d', balance: 1500 },
    ];

    for (const wallet of wallets) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO wallets (id, user_id, address, balance_tokens, balance_eur_cents, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [wallet.id, wallet.userId, wallet.address, wallet.balance, wallet.balance, now]
      });
    }
    console.log(`  ✅ ${wallets.length} wallets`);

    // ==================== CAREGIVER PROFILES ====================
    const caregiverProfiles = [
      { id: 'profile-cg-ana-silva', userId: 'cg-ana-silva', title: 'Enfermeira Especialista', bio: 'Enfermeira com 12 anos de experiência em geriatria.', city: 'Lisboa', services: 'Cuidados Pessoais,Medicação,Cuidados Paliativos,Enfermagem', hourlyRate: 2500, expYears: 12, rating: 4.9, reviews: 47, contracts: 32 },
      { id: 'profile-cg-maria-santos', userId: 'cg-maria-santos', title: 'Cuidadora Certificada', bio: 'Cuidadora certificada com foco em idosos com Alzheimer.', city: 'Porto', services: 'Companhia,Cuidados Pessoais,Estimulação Cognitiva,Refeições', hourlyRate: 1800, expYears: 8, rating: 4.8, reviews: 35, contracts: 28 },
      { id: 'profile-cg-carla-oliveira', userId: 'cg-carla-oliveira', title: 'Fisioterapeuta', bio: 'Fisioterapeuta especializada em reabilitação geriátrica.', city: 'Lisboa', services: 'Fisioterapia,Mobilidade,Reabilitação,Exercícios', hourlyRate: 3000, expYears: 10, rating: 5.0, reviews: 22, contracts: 18 },
      { id: 'profile-cg-tereza-costa', userId: 'cg-tereza-costa', title: 'Auxiliar de Enfermagem', bio: 'Auxiliar de enfermagem com experiência em cuidados domiciliares.', city: 'Faro', services: 'Cuidados Pessoais,Medicação,Companhia,Tarefas Domésticas', hourlyRate: 1500, expYears: 6, rating: 4.7, reviews: 19, contracts: 15 },
      { id: 'profile-cg-lucia-ferreira', userId: 'cg-lucia-ferreira', title: 'Cuidadora de Idosos', bio: 'Cuidadora dedicada com experiência em acompanhamento integral.', city: 'Coimbra', services: 'Companhia,Refeições,Transporte,Tarefas Domésticas', hourlyRate: 1400, expYears: 5, rating: 4.6, reviews: 14, contracts: 12 },
      { id: 'profile-cg-paulo-mendes', userId: 'cg-paulo-mendes', title: 'Técnico de Enfermagem', bio: 'Técnico de enfermagem com experiência em cuidados noturnos.', city: 'Braga', services: 'Cuidados Pessoais,Medicação,Cuidados Noturnos,Enfermagem', hourlyRate: 2000, expYears: 7, rating: 4.8, reviews: 11, contracts: 9 },
      { id: 'profile-demo-caregiver-1', userId: 'demo-caregiver-1', title: 'Enfermeira', bio: 'Profissional com 10 anos de experiência em cuidados geriátricos.', city: 'Lisboa', services: 'Cuidados Pessoais,Medicação,Companhia', hourlyRate: 2500, expYears: 10, rating: 4.9, reviews: 32, contracts: 28 },
    ];

    for (const profile of caregiverProfiles) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO profiles_caregiver (id, user_id, title, bio, city, services, hourly_rate_eur, experience_years, average_rating, total_reviews, total_contracts, verification_status, document_verified, available_now, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', 1, 1, ?)`,
        args: [profile.id, profile.userId, profile.title, profile.bio, profile.city, profile.services, profile.hourlyRate, profile.expYears, profile.rating, profile.reviews, profile.contracts, now]
      });
    }
    console.log(`  ✅ ${caregiverProfiles.length} caregiver profiles`);

    // ==================== FAMILY PROFILES ====================
    const familyProfiles = [
      { id: 'profile-fm-joao-pereira', userId: 'fm-joao-pereira', city: 'Lisboa', elderName: 'Dona Maria Pereira', elderAge: 82, elderNeeds: 'Precisa de ajuda com medicação, higiene pessoal e companhia.' },
      { id: 'profile-fm-paula-silva', userId: 'fm-paula-silva', city: 'Porto', elderName: 'Sr. António Silva', elderAge: 78, elderNeeds: 'Acompanhamento para consultas médicas e fisioterapia.' },
      { id: 'profile-fm-marcos-almeida', userId: 'fm-marcos-almeida', city: 'Braga', elderName: 'Dona Teresa Almeida', elderAge: 85, elderNeeds: 'Cuidados paliativos. Precisa de enfermagem especializada.' },
      { id: 'profile-demo-family-1', userId: 'demo-family-1', city: 'Lisboa', elderName: 'Dona Helena', elderAge: 80, elderNeeds: 'Cuidados gerais' },
    ];

    for (const profile of familyProfiles) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO profiles_family (id, user_id, city, elder_name, elder_age, elder_needs, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [profile.id, profile.userId, profile.city, profile.elderName, profile.elderAge, profile.elderNeeds, now]
      });
    }
    console.log(`  ✅ ${familyProfiles.length} family profiles`);

    // ==================== TOKEN LEDGER ====================
    const ledgers = [
      { id: 'ledger-cg-ana-silva', userId: 'cg-ana-silva', amount: 5000 },
      { id: 'ledger-cg-maria-santos', userId: 'cg-maria-santos', amount: 3200 },
      { id: 'ledger-cg-carla-oliveira', userId: 'cg-carla-oliveira', amount: 4500 },
      { id: 'ledger-cg-tereza-costa', userId: 'cg-tereza-costa', amount: 2100 },
      { id: 'ledger-cg-lucia-ferreira', userId: 'cg-lucia-ferreira', amount: 1800 },
      { id: 'ledger-cg-paulo-mendes', userId: 'cg-paulo-mendes', amount: 2800 },
      { id: 'ledger-fm-joao-pereira', userId: 'fm-joao-pereira', amount: 5000 },
      { id: 'ledger-fm-paula-silva', userId: 'fm-paula-silva', amount: 3500 },
      { id: 'ledger-fm-marcos-almeida', userId: 'fm-marcos-almeida', amount: 8000 },
      { id: 'ledger-demo-family-1', userId: 'demo-family-1', amount: 2500 },
      { id: 'ledger-demo-caregiver-1', userId: 'demo-caregiver-1', amount: 1500 },
    ];

    for (const ledger of ledgers) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO token_ledger (id, user_id, type, reason, amount_tokens, amount_eur_cents, description, created_at) VALUES (?, ?, 'CREDIT', 'ACTIVATION_BONUS', ?, ?, 'Bônus de ativação de conta', ?)`,
        args: [ledger.id, ledger.userId, ledger.amount, ledger.amount, now]
      });
    }
    console.log(`  ✅ ${ledgers.length} token ledger entries`);

    // ==================== CONTRACTS ====================
    const contracts = [
      { id: 'contract-001', familyUserId: 'fm-joao-pereira', caregiverUserId: 'cg-ana-silva', status: 'ACTIVE', title: 'Cuidado diário para Dona Maria', description: 'Cuidados diários pela manhã.', serviceTypes: 'Cuidados Pessoais,Medicação,Refeições', hoursPerWeek: 20, hourlyRate: 2500, totalEur: 200000, startDate: '2024-01-15', familyAccepted: '2024-01-14T10:30:00Z', caregiverAccepted: '2024-01-14T14:00:00Z' },
      { id: 'contract-002', familyUserId: 'fm-paula-silva', caregiverUserId: 'cg-carla-oliveira', status: 'ACTIVE', title: 'Fisioterapia domiciliar', description: 'Sessões de fisioterapia 3x por semana.', serviceTypes: 'Fisioterapia,Mobilidade', hoursPerWeek: 6, hourlyRate: 3000, totalEur: 72000, startDate: '2024-02-01', familyAccepted: '2024-01-28T09:00:00Z', caregiverAccepted: '2024-01-28T11:30:00Z' },
      { id: 'contract-003', familyUserId: 'fm-marcos-almeida', caregiverUserId: 'cg-ana-silva', status: 'PENDING_ACCEPTANCE', title: 'Cuidados paliativos Dona Teresa', description: 'Cuidados paliativos integral.', serviceTypes: 'Cuidados Paliativos,Enfermagem,Cuidados Noturnos', hoursPerWeek: 60, hourlyRate: 2800, totalEur: 672000, startDate: '2024-03-01', familyAccepted: '2024-02-20T16:00:00Z', caregiverAccepted: null },
    ];

    for (const contract of contracts) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO contracts (id, family_user_id, caregiver_user_id, status, title, description, service_types, hours_per_week, hourly_rate_eur, total_eur_cents, platform_fee_pct, start_date, accepted_by_family_at, accepted_by_caregiver_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 10, ?, ?, ?, ?)`,
        args: [contract.id, contract.familyUserId, contract.caregiverUserId, contract.status, contract.title, contract.description, contract.serviceTypes, contract.hoursPerWeek, contract.hourlyRate, contract.totalEur, contract.startDate, contract.familyAccepted, contract.caregiverAccepted, now]
      });
      
      // Contract acceptance
      await db.execute({
        sql: `INSERT OR IGNORE INTO contract_acceptance (id, contract_id, accepted_by_family_at, family_ip_address, family_user_agent, accepted_by_caregiver_at, caregiver_ip_address, caregiver_user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [`acceptance-${contract.id}`, contract.id, contract.familyAccepted, '192.168.1.100', 'Mozilla/5.0', contract.caregiverAccepted, contract.caregiverAccepted ? '192.168.1.101' : null, contract.caregiverAccepted ? 'Mozilla/5.0' : null, now]
      });
    }
    console.log(`  ✅ ${contracts.length} contracts`);

    // ==================== CHAT ====================
    const chatRooms = [
      { id: 'room-001', participants: ['fm-joao-pereira', 'cg-ana-silva'], messages: [
        { senderId: 'cg-ana-silva', content: 'Olá! Como posso ajudar?', time: '2024-01-10T09:00:00Z' },
        { senderId: 'fm-joao-pereira', content: 'Minha mãe precisa de cuidados diários.', time: '2024-01-10T09:15:00Z' },
      ]},
      { id: 'room-002', participants: ['fm-paula-silva', 'cg-carla-oliveira'], messages: [
        { senderId: 'fm-paula-silva', content: 'Oi! Meu pai precisa de fisioterapia.', time: '2024-01-20T14:00:00Z' },
      ]},
    ];

    for (const room of chatRooms) {
      await db.execute({ sql: `INSERT OR IGNORE INTO chat_rooms (id, type, is_active, created_at) VALUES (?, 'direct', 1, ?)`, args: [room.id, now] });
      
      for (const userId of room.participants) {
        await db.execute({ sql: `INSERT OR IGNORE INTO chat_participants (id, chat_room_id, user_id, created_at) VALUES (?, ?, ?, ?)`, args: [`participant-${room.id}-${userId}`, room.id, userId, now] });
      }
      
      for (let i = 0; i < room.messages.length; i++) {
        const msg = room.messages[i];
        await db.execute({ sql: `INSERT OR IGNORE INTO chat_messages (id, chat_room_id, sender_id, content, message_type, created_at) VALUES (?, ?, ?, ?, 'text', ?)`, args: [`msg-${room.id}-${i + 1}`, room.id, msg.senderId, msg.content, msg.time] });
      }
    }
    console.log(`  ✅ ${chatRooms.length} chat rooms with messages`);

    // ==================== REVIEWS ====================
    const reviews = [
      { id: 'review-001', contractId: 'contract-001', fromUserId: 'fm-joao-pereira', toUserId: 'cg-ana-silva', rating: 5, comment: 'Profissional excepcional! Muito dedicada.' },
      { id: 'review-002', contractId: 'contract-002', fromUserId: 'fm-paula-silva', toUserId: 'cg-carla-oliveira', rating: 5, comment: 'Carla é muito competente. Meu pai já está sentindo melhora.' },
    ];

    for (const review of reviews) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO reviews (id, contract_id, from_user_id, to_user_id, rating, comment, punctuality_rating, professionalism_rating, communication_rating, quality_rating, is_public, is_moderated, created_at) VALUES (?, ?, ?, ?, ?, ?, 5, 5, 5, 5, 1, 1, ?)`,
        args: [review.id, review.contractId, review.fromUserId, review.toUserId, review.rating, review.comment, now]
      });
    }
    console.log(`  ✅ ${reviews.length} reviews`);

    // ==================== NOTIFICATIONS ====================
    const notifications = [
      { id: 'notif-001', userId: 'fm-joao-pereira', type: 'contract', title: 'Contrato Ativo', message: 'Seu contrato com Ana Silva está ativo.', refType: 'contract', refId: 'contract-001' },
      { id: 'notif-002', userId: 'cg-ana-silva', type: 'review', title: 'Nova Avaliação', message: 'João Pereira deixou uma avaliação 5 estrelas!', refType: 'review', refId: 'review-001' },
      { id: 'notif-003', userId: 'cg-ana-silva', type: 'contract', title: 'Novo Contrato Pendente', message: 'Marcos Almeida deseja contratar seus serviços.', refType: 'contract', refId: 'contract-003' },
    ];

    for (const notif of notifications) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO notifications (id, user_id, type, title, message, reference_type, reference_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [notif.id, notif.userId, notif.type, notif.title, notif.message, notif.refType, notif.refId, now]
      });
    }
    console.log(`  ✅ ${notifications.length} notifications`);

    console.log('\n🎉 Database setup complete!\n');
    console.log('📋 SUMMARY:');
    console.log('━'.repeat(50));
    console.log(`  👥 Users: ${users.length}`);
    console.log(`  💼 Wallets: ${wallets.length}`);
    console.log(`  👨‍👩‍👧 Caregivers: ${caregiverProfiles.length}`);
    console.log(`  👨‍👩‍👧 Families: ${familyProfiles.length}`);
    console.log(`  📄 Contracts: ${contracts.length}`);
    console.log(`  💬 Chat Rooms: ${chatRooms.length}`);
    console.log(`  ⭐ Reviews: ${reviews.length}`);
    console.log(`  🔔 Notifications: ${notifications.length}`);
    console.log('━'.repeat(50));
    console.log('\n🔑 Test Credentials:');
    console.log('  📧 familia@teste.com / teste123');
    console.log('  📧 cuidador@teste.com / teste123');
    console.log('  📧 joao.pereira@exemplo.com / teste123');
    console.log('  📧 ana.silva@exemplo.com / teste123');
    console.log('\n✨ Ready to use!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

setupTurso().catch(console.error);
