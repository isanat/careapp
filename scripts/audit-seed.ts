import { createClient } from '@libsql/client';
import * as bcrypt from 'bcryptjs';

async function auditAndSeed() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  console.log('🔍 AUDITORIA COMPLETA DO BANCO TURSO\n');
  console.log('=' .repeat(50));

  // 1. Verificar tabelas existentes
  console.log('\n📊 TABELAS EXISTENTES:');
  const tables = await db.execute(`
    SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
  `);
  tables.rows.forEach(t => console.log(`  - ${t.name}`));

  // 2. Verificar usuários
  console.log('\n👤 USUÁRIOS:');
  const users = await db.execute(`SELECT id, email, name, role, status FROM users`);
  console.log(`  Total: ${users.rows.length}`);
  users.rows.forEach(u => console.log(`  - ${u.email} (${u.role}) - ${u.status}`));

  // 3. Verificar wallets
  console.log('\n💰 CARTEIRAS:');
  const wallets = await db.execute(`SELECT id, user_id, address, balance_tokens FROM wallets`);
  console.log(`  Total: ${wallets.rows.length}`);
  wallets.rows.forEach(w => console.log(`  - User: ${w.user_id} | Balance: ${w.balance_tokens} SENT`));

  // 4. Verificar perfis de cuidador
  console.log('\n👩‍⚕️ PERFIS CUIDADOR:');
  const caregiverProfiles = await db.execute(`SELECT id, user_id, title, city FROM profiles_caregiver`);
  console.log(`  Total: ${caregiverProfiles.rows.length}`);
  
  // 5. Verificar perfis de família
  console.log('\n👨‍👩‍👧 PERFIS FAMÍLIA:');
  const familyProfiles = await db.execute(`SELECT id, user_id, city, elder_name FROM profiles_family`);
  console.log(`  Total: ${familyProfiles.rows.length}`);

  // 6. Verificar transações
  console.log('\n📝 TRANSAÇÕES (token_ledger):');
  const transactions = await db.execute(`SELECT COUNT(*) as count FROM token_ledger`);
  console.log(`  Total: ${transactions.rows[0]?.count || 0}`);

  // 7. Verificar contratos
  console.log('\n📄 CONTRATOS:');
  try {
    const contracts = await db.execute(`SELECT COUNT(*) as count FROM contracts`);
    console.log(`  Total: ${contracts.rows[0]?.count || 0}`);
  } catch (e) {
    console.log('  ❌ Tabela não existe');
  }

  console.log('\n' + '='.repeat(50));
  console.log('🌱 SEEDING DE DADOS DEMO\n');

  const passwordHash = await bcrypt.hash('teste123', 10);

  // =====================================
  // SEED: CUIDADORES
  // =====================================
  const caregivers = [
    {
      id: 'cg-001',
      email: 'ana.silva@exemplo.com',
      name: 'Ana Silva',
      title: 'Enfermeira Especialista',
      bio: 'Enfermeira com 12 anos de experiência em cuidados geriátricos. Especializada em Alzheimer e Parkinson. Atendimento humanizado e dedicado.',
      city: 'Lisboa',
      experience_years: 12,
      services: 'Cuidados Pessoais,Medicação,Enfermagem,Alzheimer',
      hourly_rate_eur: 2500,
      average_rating: 4.9,
      total_reviews: 47,
    },
    {
      id: 'cg-002',
      email: 'maria.santos@exemplo.com',
      name: 'Maria Santos',
      title: 'Cuidadora Certificada',
      bio: 'Cuidadora certificada com foco em companhia e cuidados diários. Experiência com idosos acamados e mobilidade reduzida.',
      city: 'Porto',
      experience_years: 8,
      services: 'Companhia,Alimentação,Cuidados Pessoais,Mobilidade',
      hourly_rate_eur: 1800,
      average_rating: 4.8,
      total_reviews: 32,
    },
    {
      id: 'cg-003',
      email: 'carla.oliveira@exemplo.com',
      name: 'Carla Oliveira',
      title: 'Fisioterapeuta',
      bio: 'Fisioterapeuta especializada em reabilitação geriátrica. Ajudo idosos a manterem mobilidade e independência.',
      city: 'Lisboa',
      experience_years: 10,
      services: 'Fisioterapia,Reabilitação,Mobilidade,Exercícios',
      hourly_rate_eur: 3000,
      average_rating: 5.0,
      total_reviews: 28,
    },
    {
      id: 'cg-004',
      email: 'tereza.costa@exemplo.com',
      name: 'Tereza Costa',
      title: 'Auxiliar de Enfermagem',
      bio: 'Auxiliar de enfermagem com experiência em cuidados paliativos e atenção domiciliar. Paciente e carinhosa.',
      city: 'Faro',
      experience_years: 6,
      services: 'Cuidados Pessoais,Medicação,Paliativos,Noite',
      hourly_rate_eur: 1600,
      average_rating: 4.7,
      total_reviews: 19,
    },
    {
      id: 'cg-005',
      email: 'lucia.ferreira@exemplo.com',
      name: 'Lúcia Ferreira',
      title: 'Cuidadora de Idosos',
      bio: 'Dedicada a proporcionar qualidade de vida aos idosos. Experiência com demência e necessidades especiais.',
      city: 'Coimbra',
      experience_years: 5,
      services: 'Companhia,Cuidados Pessoais,Alimentação,Demência',
      hourly_rate_eur: 1500,
      average_rating: 4.6,
      total_reviews: 15,
    },
  ];

  for (const cg of caregivers) {
    try {
      // Inserir usuário
      await db.execute({
        sql: `INSERT OR IGNORE INTO users (id, email, name, password_hash, role, status, verification_status) VALUES (?, ?, ?, ?, 'CAREGIVER', 'ACTIVE', 'VERIFIED')`,
        args: [cg.id, cg.email, cg.name, passwordHash]
      });
      
      // Inserir carteira
      const walletAddress = `0x${cg.id.split('-')[1]}${Date.now().toString(16)}a3b2c1d4e5f6`;
      await db.execute({
        sql: `INSERT OR IGNORE INTO wallets (id, user_id, address, balance_tokens) VALUES (?, ?, ?, ?)`,
        args: [`wallet-${cg.id}`, cg.id, walletAddress, 1500]
      });
      
      // Inserir perfil
      await db.execute({
        sql: `INSERT OR IGNORE INTO profiles_caregiver (id, user_id, title, bio, experience_years, city, services, hourly_rate_eur, average_rating, total_reviews, total_contracts, total_hours_worked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [`profile-${cg.id}`, cg.id, cg.title, cg.bio, cg.experience_years, cg.city, cg.services, cg.hourly_rate_eur, cg.average_rating, cg.total_reviews, Math.floor(cg.total_reviews * 0.7), cg.experience_years * 200]
      });
      
      console.log(`✅ Cuidador: ${cg.name} (${cg.city})`);
    } catch (error: any) {
      if (!error.message.includes('UNIQUE constraint')) {
        console.log(`ℹ️ ${cg.email} já existe`);
      }
    }
  }

  // =====================================
  // SEED: FAMÍLIAS
  // =====================================
  const families = [
    {
      id: 'fm-001',
      email: 'joao.pereira@exemplo.com',
      name: 'João Pereira',
      city: 'Lisboa',
      elder_name: 'Dona Maria Pereira',
      elder_age: 82,
      emergency_contact: 'Ana Pereira',
      emergency_phone: '+351 912 345 678',
    },
    {
      id: 'fm-002',
      email: 'paula.silva@exemplo.com',
      name: 'Paula Silva',
      city: 'Porto',
      elder_name: 'Sr. António Silva',
      elder_age: 78,
      emergency_contact: 'Ricardo Silva',
      emergency_phone: '+351 923 456 789',
    },
    {
      id: 'fm-003',
      email: 'marcos.almeida@exemplo.com',
      name: 'Marcos Almeida',
      city: 'Braga',
      elder_name: 'Dona Teresa Almeida',
      elder_age: 85,
      emergency_contact: 'Sofia Almeida',
      emergency_phone: '+351 934 567 890',
    },
  ];

  for (const fm of families) {
    try {
      await db.execute({
        sql: `INSERT OR IGNORE INTO users (id, email, name, password_hash, role, status, verification_status) VALUES (?, ?, ?, ?, 'FAMILY', 'ACTIVE', 'VERIFIED')`,
        args: [fm.id, fm.email, fm.name, passwordHash]
      });
      
      const walletAddress = `0x${fm.id.split('-')[1]}${Date.now().toString(16)}f1e2d3c4b5a6`;
      await db.execute({
        sql: `INSERT OR IGNORE INTO wallets (id, user_id, address, balance_tokens) VALUES (?, ?, ?, ?)`,
        args: [`wallet-${fm.id}`, fm.id, walletAddress, 2500]
      });
      
      await db.execute({
        sql: `INSERT OR IGNORE INTO profiles_family (id, user_id, city, elder_name, elder_age, emergency_contact_name, emergency_contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [`profile-${fm.id}`, fm.id, fm.city, fm.elder_name, fm.elder_age, fm.emergency_contact, fm.emergency_phone]
      });
      
      console.log(`✅ Família: ${fm.name} (${fm.city})`);
    } catch (error: any) {
      if (!error.message.includes('UNIQUE constraint')) {
        console.log(`ℹ️ ${fm.email} já existe`);
      }
    }
  }

  // =====================================
  // SEED: TRANSAÇÕES DE EXEMPLO
  // =====================================
  console.log('\n💰 Criando transações de exemplo...');
  
  // Transação para família demo
  await db.execute({
    sql: `INSERT OR IGNORE INTO token_ledger (id, user_id, type, reason, amount_tokens, amount_eur_cents, description, created_at) VALUES (?, ?, 'CREDIT', 'ACTIVATION_BONUS', 2500, 2500, 'Bônus de ativação de conta', datetime('now', '-7 days'))`,
    args: ['tx-001', 'demo-family-1']
  });
  
  // Transação para cuidador demo
  await db.execute({
    sql: `INSERT OR IGNORE INTO token_ledger (id, user_id, type, reason, amount_tokens, amount_eur_cents, description, created_at) VALUES (?, ?, 'CREDIT', 'ACTIVATION_BONUS', 1500, 1500, 'Bônus de ativação de conta', datetime('now', '-5 days'))`,
    args: ['tx-002', 'demo-caregiver-1']
  });

  console.log('✅ Transações criadas');

  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO FINAL\n');

  // Contagem final
  const finalUsers = await db.execute(`SELECT COUNT(*) as count FROM users`);
  const finalWallets = await db.execute(`SELECT COUNT(*) as count FROM wallets`);
  const finalCaregivers = await db.execute(`SELECT COUNT(*) as count FROM profiles_caregiver`);
  const finalFamilies = await db.execute(`SELECT COUNT(*) as count FROM profiles_family`);
  const finalTransactions = await db.execute(`SELECT COUNT(*) as count FROM token_ledger`);

  console.log(`Usuários: ${finalUsers.rows[0]?.count}`);
  console.log(`Carteiras: ${finalWallets.rows[0]?.count}`);
  console.log(`Perfis Cuidador: ${finalCaregivers.rows[0]?.count}`);
  console.log(`Perfis Família: ${finalFamilies.rows[0]?.count}`);
  console.log(`Transações: ${finalTransactions.rows[0]?.count}`);

  console.log('\n✅ AUDITORIA E SEED COMPLETOS!');
}

auditAndSeed().catch(console.error);
