import { createClient } from '@libsql/client';
import * as bcrypt from 'bcryptjs';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const SENT_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';
const CONTRACT_REGISTRY_ADDRESS = '0x0000000000000000000000000000000000000000';

async function updateTurso() {
  console.log('🔄 Updating IdosoLink database on Turso...\n');

  const passwordHash = await bcrypt.hash('teste123', 10);
  const now = new Date().toISOString();

  try {
    // ==================== UPDATE PLATFORM SETTINGS ====================
    const existingSettings = await db.execute("SELECT id FROM platform_settings");
    if (existingSettings.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO platform_settings (id, activation_cost_eur_cents, contract_fee_eur_cents, platform_fee_percent, token_price_eur_cents, senior_token_address, contract_registry_address) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: ['settings-main', 3500, 500, 10, 1, SENT_TOKEN_ADDRESS, CONTRACT_REGISTRY_ADDRESS]
      });
      console.log('  ✅ Platform settings created');
    } else {
      await db.execute({
        sql: `UPDATE platform_settings SET activation_cost_eur_cents = ?, platform_fee_percent = ?, updated_at = ? WHERE id = ?`,
        args: [3500, 10, now, 'settings-main']
      });
      console.log('  ✅ Platform settings updated (€35, 10%)');
    }

    // ==================== ENSURE ALL USERS HAVE WALLETS ====================
    const users = await db.execute("SELECT id, email, role FROM users");
    console.log(`\n👥 Found ${users.rows.length} users`);

    for (const user of users.rows) {
      const existingWallet = await db.execute({
        sql: "SELECT id FROM wallets WHERE user_id = ?",
        args: [user.id as string]
      });

      if (existingWallet.rows.length === 0) {
        const walletId = `wallet-${user.id}`;
        const address = `0x${user.id?.toString().replace(/-/g, '').substring(0, 40).padEnd(40, '0')}`;
        const initialBalance = user.role === 'CAREGIVER' ? 2000 : 3000;

        await db.execute({
          sql: `INSERT INTO wallets (id, user_id, address, balance_tokens, balance_eur_cents, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [walletId, user.id, address, initialBalance, initialBalance, now]
        });

        await db.execute({
          sql: `INSERT INTO token_ledger (id, user_id, type, reason, amount_tokens, amount_eur_cents, description, created_at) VALUES (?, ?, 'CREDIT', 'ACTIVATION_BONUS', ?, ?, 'Bônus de ativação de conta', ?)`,
          args: [`ledger-${user.id}-activation`, user.id, initialBalance, initialBalance, now]
        });

        console.log(`  ✅ Created wallet for ${user.email} (${initialBalance} SENT)`);
      } else {
        console.log(`  ℹ️ Wallet already exists for ${user.email}`);
      }
    }

    // ==================== UPDATE/CREATE CAREGIVER PROFILES ====================
    const caregiverProfiles = [
      { userId: 'demo-caregiver-1', title: 'Enfermeira', bio: 'Profissional com 10 anos de experiência em cuidados geriátricos.', city: 'Lisboa', services: 'Cuidados Pessoais,Medicação,Companhia', hourlyRate: 2500, expYears: 10, rating: 4.9, reviews: 32, contracts: 28 },
      { userId: 'cg-ana', title: 'Enfermeira Especialista', bio: 'Enfermeira com 12 anos de experiência em geriatria. Especializada em cuidados paliativos.', city: 'Lisboa', services: 'Cuidados Pessoais,Medicação,Cuidados Paliativos,Enfermagem', hourlyRate: 2500, expYears: 12, rating: 4.9, reviews: 47, contracts: 32 },
      { userId: 'cg-maria', title: 'Cuidadora Certificada', bio: 'Cuidadora certificada com foco em idosos com Alzheimer e outras demências.', city: 'Porto', services: 'Companhia,Cuidados Pessoais,Estimulação Cognitiva,Refeições', hourlyRate: 1800, expYears: 8, rating: 4.8, reviews: 35, contracts: 28 },
      { userId: 'cg-carla', title: 'Fisioterapeuta', bio: 'Fisioterapeuta especializada em reabilitação geriátrica.', city: 'Lisboa', services: 'Fisioterapia,Mobilidade,Reabilitação,Exercícios', hourlyRate: 3000, expYears: 10, rating: 5.0, reviews: 22, contracts: 18 },
      { userId: 'cg-tereza', title: 'Auxiliar de Enfermagem', bio: 'Auxiliar de enfermagem com experiência em cuidados domiciliares.', city: 'Faro', services: 'Cuidados Pessoais,Medicação,Companhia,Tarefas Domésticas', hourlyRate: 1500, expYears: 6, rating: 4.7, reviews: 19, contracts: 15 },
      { userId: 'cg-lucia', title: 'Cuidadora de Idosos', bio: 'Cuidadora dedicada com experiência em acompanhamento integral.', city: 'Coimbra', services: 'Companhia,Refeições,Transporte,Tarefas Domésticas', hourlyRate: 1400, expYears: 5, rating: 4.6, reviews: 14, contracts: 12 },
      { userId: 'cg-paulo-mendes', title: 'Técnico de Enfermagem', bio: 'Técnico de enfermagem com experiência em cuidados noturnos.', city: 'Braga', services: 'Cuidados Pessoais,Medicação,Cuidados Noturnos,Enfermagem', hourlyRate: 2000, expYears: 7, rating: 4.8, reviews: 11, contracts: 9 },
    ];

    console.log('\n💼 Updating caregiver profiles...');
    for (const profile of caregiverProfiles) {
      const existing = await db.execute({
        sql: "SELECT id FROM profiles_caregiver WHERE user_id = ?",
        args: [profile.userId]
      });

      if (existing.rows.length === 0) {
        await db.execute({
          sql: `INSERT INTO profiles_caregiver (id, user_id, title, bio, city, services, hourly_rate_eur, experience_years, average_rating, total_reviews, total_contracts, verification_status, document_verified, available_now, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', 1, 1, ?)`,
          args: [`profile-${profile.userId}`, profile.userId, profile.title, profile.bio, profile.city, profile.services, profile.hourlyRate, profile.expYears, profile.rating, profile.reviews, profile.contracts, now]
        });
        console.log(`  ✅ Created profile for ${profile.userId}`);
      } else {
        await db.execute({
          sql: `UPDATE profiles_caregiver SET title = ?, bio = ?, city = ?, services = ?, hourly_rate_eur = ?, experience_years = ?, average_rating = ?, total_reviews = ?, total_contracts = ?, verification_status = 'VERIFIED', document_verified = 1, available_now = 1, updated_at = ? WHERE user_id = ?`,
          args: [profile.title, profile.bio, profile.city, profile.services, profile.hourlyRate, profile.expYears, profile.rating, profile.reviews, profile.contracts, now, profile.userId]
        });
        console.log(`  ✅ Updated profile for ${profile.userId}`);
      }
    }

    // ==================== UPDATE/CREATE FAMILY PROFILES ====================
    const familyProfiles = [
      { userId: 'demo-family-1', city: 'Lisboa', elderName: 'Dona Helena', elderAge: 80, elderNeeds: 'Cuidados gerais com acompanhamento.', emergencyName: 'Ana Silva', emergencyPhone: '+351 912 345 678' },
      { userId: 'fm-joao', city: 'Lisboa', elderName: 'Dona Maria Pereira', elderAge: 82, elderNeeds: 'Precisa de ajuda com medicação, higiene pessoal e companhia. Tem mobilidade reduzida.', emergencyName: 'Ana Pereira', emergencyPhone: '+351 912 345 678' },
      { userId: 'fm-paula', city: 'Porto', elderName: 'Sr. António Silva', elderAge: 78, elderNeeds: 'Acompanhamento para consultas médicas, fisioterapia e companhia. Tem Alzheimer inicial.', emergencyName: 'Ricardo Silva', emergencyPhone: '+351 923 456 789' },
      { userId: 'fm-marcos', city: 'Braga', elderName: 'Dona Teresa Almeida', elderAge: 85, elderNeeds: 'Cuidados paliativos. Precisa de enfermagem especializada e acompanhamento integral.', emergencyName: 'Sofia Almeida', emergencyPhone: '+351 934 567 890' },
    ];

    console.log('\n👨‍👩‍👧 Updating family profiles...');
    for (const profile of familyProfiles) {
      const existing = await db.execute({
        sql: "SELECT id FROM profiles_family WHERE user_id = ?",
        args: [profile.userId]
      });

      if (existing.rows.length === 0) {
        await db.execute({
          sql: `INSERT INTO profiles_family (id, user_id, city, elder_name, elder_age, elder_needs, emergency_contact_name, emergency_contact_phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [`profile-${profile.userId}`, profile.userId, profile.city, profile.elderName, profile.elderAge, profile.elderNeeds, profile.emergencyName, profile.emergencyPhone, now]
        });
        console.log(`  ✅ Created profile for ${profile.userId}`);
      } else {
        await db.execute({
          sql: `UPDATE profiles_family SET city = ?, elder_name = ?, elder_age = ?, elder_needs = ?, emergency_contact_name = ?, emergency_contact_phone = ?, updated_at = ? WHERE user_id = ?`,
          args: [profile.city, profile.elderName, profile.elderAge, profile.elderNeeds, profile.emergencyName, profile.emergencyPhone, now, profile.userId]
        });
        console.log(`  ✅ Updated profile for ${profile.userId}`);
      }
    }

    // ==================== UPDATE CONTRACTS ====================
    const contracts = [
      { id: 'contract-001', familyUserId: 'fm-joao', caregiverUserId: 'cg-ana', status: 'ACTIVE', title: 'Cuidado diário para Dona Maria', description: 'Cuidados diários pela manhã, incluindo higiene pessoal, medicação e preparo de refeições.', serviceTypes: 'Cuidados Pessoais,Medicação,Refeições', hoursPerWeek: 20, hourlyRate: 2500, totalEur: 200000, startDate: '2024-01-15', familyAccepted: '2024-01-14T10:30:00Z', caregiverAccepted: '2024-01-14T14:00:00Z' },
      { id: 'contract-002', familyUserId: 'fm-paula', caregiverUserId: 'cg-carla', status: 'ACTIVE', title: 'Fisioterapia domiciliar para Sr. António', description: 'Sessões de fisioterapia 3x por semana para manutenção da mobilidade.', serviceTypes: 'Fisioterapia,Mobilidade', hoursPerWeek: 6, hourlyRate: 3000, totalEur: 72000, startDate: '2024-02-01', familyAccepted: '2024-01-28T09:00:00Z', caregiverAccepted: '2024-01-28T11:30:00Z' },
      { id: 'contract-003', familyUserId: 'fm-marcos', caregiverUserId: 'cg-ana', status: 'PENDING_ACCEPTANCE', title: 'Cuidados paliativos Dona Teresa', description: 'Cuidados paliativos integral, plantões de 12h, 5 dias por semana.', serviceTypes: 'Cuidados Paliativos,Enfermagem,Cuidados Noturnos', hoursPerWeek: 60, hourlyRate: 2800, totalEur: 672000, startDate: '2024-03-01', familyAccepted: '2024-02-20T16:00:00Z', caregiverAccepted: null },
    ];

    console.log('\n📄 Updating contracts...');
    for (const contract of contracts) {
      const existing = await db.execute({
        sql: "SELECT id FROM contracts WHERE id = ?",
        args: [contract.id]
      });

      if (existing.rows.length === 0) {
        await db.execute({
          sql: `INSERT INTO contracts (id, family_user_id, caregiver_user_id, status, title, description, service_types, hours_per_week, hourly_rate_eur, total_eur_cents, platform_fee_pct, start_date, accepted_by_family_at, accepted_by_caregiver_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 10, ?, ?, ?, ?)`,
          args: [contract.id, contract.familyUserId, contract.caregiverUserId, contract.status, contract.title, contract.description, contract.serviceTypes, contract.hoursPerWeek, contract.hourlyRate, contract.totalEur, contract.startDate, contract.familyAccepted, contract.caregiverAccepted, now]
        });
        
        // Create acceptance record
        await db.execute({
          sql: `INSERT OR IGNORE INTO contract_acceptance (id, contract_id, accepted_by_family_at, family_ip_address, family_user_agent, accepted_by_caregiver_at, caregiver_ip_address, caregiver_user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [`acceptance-${contract.id}`, contract.id, contract.familyAccepted, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', contract.caregiverAccepted, contract.caregiverAccepted ? '192.168.1.101' : null, contract.caregiverAccepted ? 'Mozilla/5.0 (iPhone)' : null, now]
        });
        console.log(`  ✅ Created contract: ${contract.title}`);
      } else {
        await db.execute({
          sql: `UPDATE contracts SET status = ?, title = ?, description = ?, service_types = ?, hours_per_week = ?, hourly_rate_eur = ?, total_eur_cents = ?, platform_fee_pct = 10, accepted_by_family_at = ?, accepted_by_caregiver_at = ?, updated_at = ? WHERE id = ?`,
          args: [contract.status, contract.title, contract.description, contract.serviceTypes, contract.hoursPerWeek, contract.hourlyRate, contract.totalEur, contract.familyAccepted, contract.caregiverAccepted, now, contract.id]
        });
        console.log(`  ✅ Updated contract: ${contract.title}`);
      }
    }

    // ==================== CREATE CHAT ROOMS ====================
    console.log('\n💬 Setting up chat rooms...');
    const chatRooms = [
      { id: 'room-001', participants: ['fm-joao', 'cg-ana'], messages: [
        { senderId: 'cg-ana', content: 'Olá João! Vi que você tem interesse nos meus serviços. Como posso ajudar?', time: '2024-01-10T09:00:00Z' },
        { senderId: 'fm-joao', content: 'Olá Ana! Sim, minha mãe precisa de cuidados diários. Ela tem 82 anos e mobilidade reduzida.', time: '2024-01-10T09:15:00Z' },
        { senderId: 'cg-ana', content: 'Entendo. Tenho muita experiência com idosos nessa faixa etária. Qual seria o horário desejado?', time: '2024-01-10T09:30:00Z' },
        { senderId: 'fm-joao', content: 'Precisaria de segunda a sexta, das 8h às 12h.', time: '2024-01-10T10:00:00Z' },
        { senderId: 'cg-ana', content: 'Perfeito! Tenho disponibilidade nesse horário. Vamos marcar uma visita?', time: '2024-01-10T10:15:00Z' },
      ]},
      { id: 'room-002', participants: ['fm-paula', 'cg-carla'], messages: [
        { senderId: 'fm-paula', content: 'Oi Carla! Vi que você é fisioterapeuta. Meu pai precisa de sessões em casa.', time: '2024-01-20T14:00:00Z' },
        { senderId: 'cg-carla', content: 'Olá Paula! Sim, faço atendimento domiciliar. Me conte mais sobre as necessidades do seu pai.', time: '2024-01-20T14:30:00Z' },
      ]},
    ];

    for (const room of chatRooms) {
      const existingRoom = await db.execute({
        sql: "SELECT id FROM chat_rooms WHERE id = ?",
        args: [room.id]
      });

      if (existingRoom.rows.length === 0) {
        await db.execute({
          sql: `INSERT INTO chat_rooms (id, type, is_active, created_at) VALUES (?, 'direct', 1, ?)`,
          args: [room.id, now]
        });

        for (const userId of room.participants) {
          await db.execute({
            sql: `INSERT INTO chat_participants (id, chat_room_id, user_id, created_at) VALUES (?, ?, ?, ?)`,
            args: [`participant-${room.id}-${userId}`, room.id, userId, now]
          });
        }

        for (let i = 0; i < room.messages.length; i++) {
          const msg = room.messages[i];
          await db.execute({
            sql: `INSERT INTO chat_messages (id, chat_room_id, sender_id, content, message_type, created_at) VALUES (?, ?, ?, ?, 'text', ?)`,
            args: [`msg-${room.id}-${i + 1}`, room.id, msg.senderId, msg.content, msg.time]
          });
        }
        console.log(`  ✅ Created chat room ${room.id}`);
      } else {
        console.log(`  ℹ️ Chat room ${room.id} already exists`);
      }
    }

    // ==================== CREATE REVIEWS ====================
    console.log('\n⭐ Setting up reviews...');
    const reviews = [
      { id: 'review-001', contractId: 'contract-001', fromUserId: 'fm-joao', toUserId: 'cg-ana', rating: 5, comment: 'Ana é uma profissional excepcional. Minha mãe adora ela! Muito dedicada e carinhosa. Recomendo muito!' },
      { id: 'review-002', contractId: 'contract-002', fromUserId: 'fm-paula', toUserId: 'cg-carla', rating: 5, comment: 'Carla é muito competente. Meu pai já está sentindo melhora na mobilidade após apenas algumas sessões.' },
    ];

    for (const review of reviews) {
      const existing = await db.execute({
        sql: "SELECT id FROM reviews WHERE id = ?",
        args: [review.id]
      });

      if (existing.rows.length === 0) {
        await db.execute({
          sql: `INSERT INTO reviews (id, contract_id, from_user_id, to_user_id, rating, comment, punctuality_rating, professionalism_rating, communication_rating, quality_rating, is_public, is_moderated, created_at) VALUES (?, ?, ?, ?, ?, ?, 5, 5, 5, 5, 1, 1, ?)`,
          args: [review.id, review.contractId, review.fromUserId, review.toUserId, review.rating, review.comment, now]
        });
        console.log(`  ✅ Created review: ${review.id}`);
      }
    }

    // ==================== CREATE NOTIFICATIONS ====================
    console.log('\n🔔 Setting up notifications...');
    const notifications = [
      { id: 'notif-001', userId: 'fm-joao', type: 'contract', title: 'Contrato Ativo', message: 'Seu contrato com Ana está ativo desde 15/01/2024.', refType: 'contract', refId: 'contract-001' },
      { id: 'notif-002', userId: 'cg-ana', type: 'review', title: 'Nova Avaliação', message: 'João Pereira deixou uma avaliação 5 estrelas para você!', refType: 'review', refId: 'review-001' },
      { id: 'notif-003', userId: 'cg-ana', type: 'contract', title: 'Novo Contrato Pendente', message: 'Marcos Almeida deseja contratar seus serviços. Aguardando seu aceite.', refType: 'contract', refId: 'contract-003' },
      { id: 'notif-004', userId: 'fm-marcos', type: 'contract', title: 'Contrato Aguardando Aceite', message: 'Seu contrato com Ana foi enviado. Aguardando aceite do cuidador.', refType: 'contract', refId: 'contract-003' },
    ];

    for (const notif of notifications) {
      const existing = await db.execute({
        sql: "SELECT id FROM notifications WHERE id = ?",
        args: [notif.id]
      });

      if (existing.rows.length === 0) {
        await db.execute({
          sql: `INSERT INTO notifications (id, user_id, type, title, message, reference_type, reference_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [notif.id, notif.userId, notif.type, notif.title, notif.message, notif.refType, notif.refId, now]
        });
        console.log(`  ✅ Created notification: ${notif.id}`);
      }
    }

    // ==================== UPDATE USER STATUS ====================
    console.log('\n✅ Updating user statuses...');
    await db.execute(`UPDATE users SET status = 'ACTIVE', verification_status = 'VERIFIED' WHERE status = 'PENDING'`);
    console.log('  ✅ All users set to ACTIVE and VERIFIED');

    // ==================== FINAL SUMMARY ====================
    const finalUsers = await db.execute("SELECT COUNT(*) as count FROM users");
    const finalWallets = await db.execute("SELECT COUNT(*) as count FROM wallets");
    const finalContracts = await db.execute("SELECT COUNT(*) as count FROM contracts");
    const finalReviews = await db.execute("SELECT COUNT(*) as count FROM reviews");
    const finalChatRooms = await db.execute("SELECT COUNT(*) as count FROM chat_rooms");

    console.log('\n🎉 Database update complete!\n');
    console.log('📋 FINAL SUMMARY:');
    console.log('━'.repeat(50));
    console.log(`  👥 Users: ${finalUsers.rows[0].count}`);
    console.log(`  💼 Wallets: ${finalWallets.rows[0].count}`);
    console.log(`  📄 Contracts: ${finalContracts.rows[0].count}`);
    console.log(`  ⭐ Reviews: ${finalReviews.rows[0].count}`);
    console.log(`  💬 Chat Rooms: ${finalChatRooms.rows[0].count}`);
    console.log('━'.repeat(50));
    console.log('\n🔑 Test Credentials:');
    console.log('  📧 familia@teste.com / teste123');
    console.log('  📧 cuidador@teste.com / teste123');
    console.log('  📧 joao.pereira@exemplo.com / teste123');
    console.log('  📧 ana.silva@exemplo.com / teste123');
    console.log('\n✨ Ready for production!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

updateTurso().catch(console.error);
