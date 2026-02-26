import { createClient } from '@libsql/client';
import * as bcrypt from 'bcryptjs';

async function setupTurso() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  console.log('🔧 CONFIGURANDO BANCO TURSO COMPLETO\n');

  // =====================================
  // 1. CRIAR TODAS AS TABELAS
  // =====================================
  
  console.log('📦 Criando tabelas...\n');

  // Users
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
      phone_verified INTEGER DEFAULT 0,
      verification_status TEXT DEFAULT 'UNVERIFIED',
      profile_image TEXT,
      preferred_language TEXT DEFAULT 'pt',
      timezone TEXT DEFAULT 'Europe/Lisbon',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT
    )
  `);
  console.log('✅ users');

  // Wallets
  await db.execute(`
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
    )
  `);
  console.log('✅ wallets');

  // Token Ledger
  await db.execute(`
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
    )
  `);
  console.log('✅ token_ledger');

  // Profiles Caregiver
  await db.execute(`
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
    )
  `);
  console.log('✅ profiles_caregiver');

  // Profiles Family
  await db.execute(`
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
    )
  `);
  console.log('✅ profiles_family');

  // Contracts
  await db.execute(`
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
      platform_fee_pct INTEGER DEFAULT 15,
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
    )
  `);
  console.log('✅ contracts');

  // Payments
  await db.execute(`
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
    )
  `);
  console.log('✅ payments');

  // Reviews
  await db.execute(`
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
    )
  `);
  console.log('✅ reviews');

  // Tips
  await db.execute(`
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
    )
  `);
  console.log('✅ tips');

  // Chat Rooms
  await db.execute(`
    CREATE TABLE IF NOT EXISTS chat_rooms (
      id TEXT PRIMARY KEY,
      type TEXT DEFAULT 'direct',
      reference_type TEXT,
      reference_id TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ chat_rooms');

  // Chat Participants
  await db.execute(`
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
    )
  `);
  console.log('✅ chat_participants');

  // Chat Messages
  await db.execute(`
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
    )
  `);
  console.log('✅ chat_messages');

  // Notifications
  await db.execute(`
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
    )
  `);
  console.log('✅ notifications');

  // Sessions (NextAuth)
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
  console.log('✅ sessions');

  // Accounts (NextAuth OAuth)
  await db.execute(`
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
    )
  `);
  console.log('✅ accounts');

  // Indexes
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_token_ledger_user ON token_ledger(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_contracts_family ON contracts(family_user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_contracts_caregiver ON contracts(caregiver_user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(chat_room_id)`);
  console.log('✅ indexes');

  console.log('\n🌱 POPULANDO DADOS DE EXEMPLO\n');

  const passwordHash = await bcrypt.hash('teste123', 10);
  const now = Date.now();

  // =====================================
  // CUIDADORES
  // =====================================
  const caregivers = [
    { id: 'cg-ana', email: 'ana.silva@exemplo.com', name: 'Ana Silva', title: 'Enfermeira Especialista', bio: 'Enfermeira com 12 anos de experiência em cuidados geriátricos. Especializada em Alzheimer e Parkinson.', city: 'Lisboa', exp: 12, services: 'Cuidados Pessoais,Medicação,Enfermagem', rate: 2500, rating: 4.9, reviews: 47 },
    { id: 'cg-maria', email: 'maria.santos@exemplo.com', name: 'Maria Santos', title: 'Cuidadora Certificada', bio: 'Cuidadora certificada com foco em companhia e cuidados diários.', city: 'Porto', exp: 8, services: 'Companhia,Alimentação,Cuidados Pessoais', rate: 1800, rating: 4.8, reviews: 32 },
    { id: 'cg-carla', email: 'carla.oliveira@exemplo.com', name: 'Carla Oliveira', title: 'Fisioterapeuta', bio: 'Fisioterapeuta especializada em reabilitação geriátrica.', city: 'Lisboa', exp: 10, services: 'Fisioterapia,Reabilitação,Mobilidade', rate: 3000, rating: 5.0, reviews: 28 },
    { id: 'cg-tereza', email: 'tereza.costa@exemplo.com', name: 'Tereza Costa', title: 'Auxiliar de Enfermagem', bio: 'Auxiliar com experiência em cuidados paliativos.', city: 'Faro', exp: 6, services: 'Cuidados Pessoais,Medicação,Paliativos', rate: 1600, rating: 4.7, reviews: 19 },
    { id: 'cg-lucia', email: 'lucia.ferreira@exemplo.com', name: 'Lúcia Ferreira', title: 'Cuidadora de Idosos', bio: 'Dedicada a proporcionar qualidade de vida aos idosos.', city: 'Coimbra', exp: 5, services: 'Companhia,Cuidados Pessoais,Alimentação', rate: 1500, rating: 4.6, reviews: 15 },
  ];

  for (const cg of caregivers) {
    try {
      await db.execute({ sql: `INSERT OR IGNORE INTO users (id, email, name, password_hash, role, status, verification_status) VALUES (?, ?, ?, ?, 'CAREGIVER', 'ACTIVE', 'VERIFIED')`, args: [cg.id, cg.email, cg.name, passwordHash] });
      await db.execute({ sql: `INSERT OR IGNORE INTO wallets (id, user_id, address, balance_tokens) VALUES (?, ?, ?, ?)`, args: [`w-${cg.id}`, cg.id, `0x${cg.id.replace('-', '')}${now}a1b2c3`, 1500] });
      await db.execute({ sql: `INSERT OR IGNORE INTO profiles_caregiver (id, user_id, title, bio, experience_years, city, services, hourly_rate_eur, average_rating, total_reviews, total_contracts, total_hours_worked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, args: [`p-${cg.id}`, cg.id, cg.title, cg.bio, cg.exp, cg.city, cg.services, cg.rate, cg.rating, cg.reviews, Math.floor(cg.reviews * 0.7), cg.exp * 200] });
      await db.execute({ sql: `INSERT OR IGNORE INTO token_ledger (id, user_id, type, reason, amount_tokens, amount_eur_cents, description, created_at) VALUES (?, ?, 'CREDIT', 'ACTIVATION_BONUS', 1500, 1500, 'Bônus de ativação de conta', datetime('now', '-${Math.floor(Math.random() * 10) + 1} days'))`, args: [`tx-${cg.id}-1`, cg.id] });
      console.log(`✅ Cuidador: ${cg.name}`);
    } catch (e) {}
  }

  // =====================================
  // FAMÍLIAS
  // =====================================
  const families = [
    { id: 'fm-joao', email: 'joao.pereira@exemplo.com', name: 'João Pereira', city: 'Lisboa', elder: 'Dona Maria Pereira', age: 82, contact: 'Ana Pereira', phone: '+351 912 345 678' },
    { id: 'fm-paula', email: 'paula.silva@exemplo.com', name: 'Paula Silva', city: 'Porto', elder: 'Sr. António Silva', age: 78, contact: 'Ricardo Silva', phone: '+351 923 456 789' },
    { id: 'fm-marcos', email: 'marcos.almeida@exemplo.com', name: 'Marcos Almeida', city: 'Braga', elder: 'Dona Teresa Almeida', age: 85, contact: 'Sofia Almeida', phone: '+351 934 567 890' },
  ];

  for (const fm of families) {
    try {
      await db.execute({ sql: `INSERT OR IGNORE INTO users (id, email, name, password_hash, role, status, verification_status) VALUES (?, ?, ?, ?, 'FAMILY', 'ACTIVE', 'VERIFIED')`, args: [fm.id, fm.email, fm.name, passwordHash] });
      await db.execute({ sql: `INSERT OR IGNORE INTO wallets (id, user_id, address, balance_tokens) VALUES (?, ?, ?, ?)`, args: [`w-${fm.id}`, fm.id, `0x${fm.id.replace('-', '')}${now}d4e5f6`, 2500] });
      await db.execute({ sql: `INSERT OR IGNORE INTO profiles_family (id, user_id, city, elder_name, elder_age, emergency_contact_name, emergency_contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?)`, args: [`p-${fm.id}`, fm.id, fm.city, fm.elder, fm.age, fm.contact, fm.phone] });
      await db.execute({ sql: `INSERT OR IGNORE INTO token_ledger (id, user_id, type, reason, amount_tokens, amount_eur_cents, description, created_at) VALUES (?, ?, 'CREDIT', 'ACTIVATION_BONUS', 2500, 2500, 'Bônus de ativação de conta', datetime('now', '-${Math.floor(Math.random() * 10) + 1} days'))`, args: [`tx-${fm.id}-1`, fm.id] });
      console.log(`✅ Família: ${fm.name}`);
    } catch (e) {}
  }

  // =====================================
  // CONTRATOS DE EXEMPLO
  // =====================================
  await db.execute({ sql: `INSERT OR IGNORE INTO contracts (id, family_user_id, caregiver_user_id, status, title, description, hourly_rate_eur, total_hours, total_eur_cents, start_date, accepted_by_family_at, accepted_by_caregiver_at, created_at) VALUES (?, ?, ?, 'ACTIVE', 'Cuidado diário para idosa', 'Cuidados diários pela manhã, medicação e companhia', 2500, 20, 50000, datetime('now', '-5 days'), datetime('now', '-4 days'), datetime('now', '-3 days'), datetime('now', '-5 days'))`, args: ['ctr-001', 'fm-joao', 'cg-ana'] });
  await db.execute({ sql: `INSERT OR IGNORE INTO contracts (id, family_user_id, caregiver_user_id, status, title, description, hourly_rate_eur, total_hours, total_eur_cents, start_date, accepted_by_family_at, accepted_by_caregiver_at, created_at) VALUES (?, ?, ?, 'ACTIVE', 'Fisioterapia domiciliar', 'Sessões de fisioterapia 3x por semana', 3000, 12, 36000, datetime('now', '-3 days'), datetime('now', '-2 days'), datetime('now', '-1 days'), datetime('now', '-3 days'))`, args: ['ctr-002', 'fm-paula', 'cg-carla'] });
  console.log('✅ Contratos de exemplo');

  // =====================================
  // CHAT DE EXEMPLO
  // =====================================
  await db.execute({ sql: `INSERT OR IGNORE INTO chat_rooms (id, type, is_active, created_at) VALUES (?, 'contract', 1, datetime('now', '-4 days'))`, args: ['chat-001'] });
  await db.execute({ sql: `INSERT OR IGNORE INTO chat_participants (id, chat_room_id, user_id, created_at) VALUES (?, ?, ?, datetime('now', '-4 days'))`, args: ['cp-001', 'chat-001', 'fm-joao'] });
  await db.execute({ sql: `INSERT OR IGNORE INTO chat_participants (id, chat_room_id, user_id, created_at) VALUES (?, ?, ?, datetime('now', '-4 days'))`, args: ['cp-002', 'chat-001', 'cg-ana'] });
  await db.execute({ sql: `INSERT OR IGNORE INTO chat_messages (id, chat_room_id, sender_id, content, created_at) VALUES (?, ?, ?, 'Olá Ana, gostaria de confirmar o horário de amanhã.', datetime('now', '-2 days'))`, args: ['msg-001', 'chat-001', 'fm-joao'] });
  await db.execute({ sql: `INSERT OR IGNORE INTO chat_messages (id, chat_room_id, sender_id, content, created_at) VALUES (?, ?, ?, 'Bom dia! Sim, estarei aí às 9h como combinado.', datetime('now', '-2 days'))`, args: ['msg-002', 'chat-001', 'cg-ana'] });
  console.log('✅ Chat de exemplo');

  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO FINAL\n');

  const tables = await db.execute(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);
  console.log(`Total de tabelas: ${tables.rows.length}`);

  const usersCount = await db.execute(`SELECT COUNT(*) as c FROM users`);
  const walletsCount = await db.execute(`SELECT COUNT(*) as c FROM wallets`);
  const caregiversCount = await db.execute(`SELECT COUNT(*) as c FROM profiles_caregiver`);
  const familiesCount = await db.execute(`SELECT COUNT(*) as c FROM profiles_family`);
  const contractsCount = await db.execute(`SELECT COUNT(*) as c FROM contracts`);
  const transactionsCount = await db.execute(`SELECT COUNT(*) as c FROM token_ledger`);
  const chatsCount = await db.execute(`SELECT COUNT(*) as c FROM chat_rooms`);

  console.log(`\nUsuários: ${usersCount.rows[0]?.c}`);
  console.log(`Carteiras: ${walletsCount.rows[0]?.c}`);
  console.log(`Perfis Cuidador: ${caregiversCount.rows[0]?.c}`);
  console.log(`Perfis Família: ${familiesCount.rows[0]?.c}`);
  console.log(`Contratos: ${contractsCount.rows[0]?.c}`);
  console.log(`Transações: ${transactionsCount.rows[0]?.c}`);
  console.log(`Chats: ${chatsCount.rows[0]?.c}`);

  console.log('\n✅ BANCO TURSO CONFIGURADO COM SUCESSO!');
  console.log('\nUsuários de teste:');
  console.log('  - familia@teste.com / teste123');
  console.log('  - cuidador@teste.com / teste123');
  console.log('  - ana.silva@exemplo.com / teste123');
  console.log('  - joao.pereira@exemplo.com / teste123');
}

setupTurso().catch(console.error);
