/**
 * Script de Migração - Consolidação de Tabelas Duplicadas no Turso
 */

const TURSO_URL = "https://idosolink-isanat.aws-us-east-1.turso.io/v2/pipeline";
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN!;

async function exec(sql: string) {
  const response = await fetch(TURSO_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TURSO_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [{ type: "execute", stmt: { sql } }]
    })
  });
  return response.json();
}

async function main() {
  console.log("🚀 Migrando dados...\n");

  // ProfileCaregiver
  console.log("📋 ProfileCaregiver...");
  let r = await exec(`
    INSERT OR IGNORE INTO ProfileCaregiver (id, userId, title, bio, experienceYears, education, certifications, languages, address, city, postalCode, country, latitude, longitude, radiusKm, services, hourlyRateEur, minimumHours, availabilityJson, availableNow, verificationStatus, documentType, documentNumber, documentVerified, backgroundCheckStatus, kycSessionId, kycSessionCreatedAt, kycCompletedAt, kycConfidence, totalContracts, totalHoursWorked, averageRating, totalReviews, portfolioImages, createdAt, updatedAt)
    SELECT id, user_id, title, bio, experience_years, education, certifications, languages, address, city, postal_code, country, latitude, longitude, radius_km, services, hourly_rate_eur, minimum_hours, availability_json, available_now, verification_status, document_type, document_number, document_verified, background_check_status, kyc_session_id, kyc_session_created_at, kyc_completed_at, kyc_confidence, total_contracts, total_hours_worked, average_rating, total_reviews, portfolio_images, created_at, updated_at
    FROM profiles_caregiver WHERE id NOT IN (SELECT id FROM ProfileCaregiver);
  `);
  console.log(`   ✅ ${r.results?.[0]?.response?.result?.affected_row_count || 0} registros`);

  // ProfileFamily
  console.log("📋 ProfileFamily...");
  r = await exec(`
    INSERT OR IGNORE INTO ProfileFamily (id, userId, address, city, postalCode, country, latitude, longitude, elderName, elderAge, elderNeeds, medicalConditions, mobilityLevel, emergencyContactName, emergencyContactPhone, emergencyContactRelation, preferredServices, preferredSchedule, budgetRange, createdAt, updatedAt)
    SELECT id, user_id, address, city, postal_code, country, latitude, longitude, elder_name, elder_age, elder_needs, medical_conditions, mobility_level, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, preferred_services, preferred_schedule, budget_range, created_at, updated_at
    FROM profiles_family WHERE id NOT IN (SELECT id FROM ProfileFamily);
  `);
  console.log(`   ✅ ${r.results?.[0]?.response?.result?.affected_row_count || 0} registros`);

  // Wallet
  console.log("📋 Wallet...");
  r = await exec(`
    INSERT OR IGNORE INTO Wallet (id, userId, address, encryptedPrivateKey, salt, balanceTokens, balanceEurCents, walletType, isExported, createdAt, updatedAt)
    SELECT id, user_id, address, encrypted_private_key, salt, balance_tokens, balance_eur_cents, wallet_type, is_exported, created_at, updated_at
    FROM wallets WHERE id NOT IN (SELECT id FROM Wallet);
  `);
  console.log(`   ✅ ${r.results?.[0]?.response?.result?.affected_row_count || 0} registros`);

  // Payment
  console.log("📋 Payment...");
  r = await exec(`
    INSERT OR IGNORE INTO Payment (id, userId, type, status, provider, amountEurCents, tokensAmount, platformFee, stripeCheckoutSessionId, stripePaymentIntentId, stripeCustomerId, contractId, description, metadata, createdAt, paidAt, refundedAt)
    SELECT id, user_id, type, status, provider, amount_eur_cents, tokens_amount, platform_fee, stripe_checkout_session_id, stripe_payment_intent_id, stripe_customer_id, contract_id, description, metadata, created_at, paid_at, refunded_at
    FROM payments WHERE id NOT IN (SELECT id FROM Payment);
  `);
  console.log(`   ✅ ${r.results?.[0]?.response?.result?.affected_row_count || 0} registros`);

  // Contract
  console.log("📋 Contract...");
  r = await exec(`
    INSERT OR IGNORE INTO Contract (id, familyUserId, caregiverUserId, status, title, description, tasksJson, serviceTypes, hoursPerWeek, scheduleJson, hourlyRateEur, totalHours, totalEurCents, platformFeePct, startDate, endDate, familyFeeTokens, caregiverFeeTokens, familyFeePaid, caregiverFeePaid, acceptedByFamilyAt, acceptedByCaregiverAt, onchainHash, onchainTxHash, onchainCreatedAt, totalPaidEurCents, createdAt, updatedAt, completedAt, cancelledAt)
    SELECT id, family_user_id, caregiver_user_id, status, title, description, tasks_json, service_types, hours_per_week, schedule_json, hourly_rate_eur, total_hours, total_eur_cents, platform_fee_pct, start_date, end_date, family_fee_tokens, caregiver_fee_tokens, family_fee_paid, caregiver_fee_paid, accepted_by_family_at, accepted_by_caregiver_at, onchain_hash, onchain_tx_hash, onchain_created_at, total_paid_eur_cents, created_at, updated_at, completed_at, cancelled_at
    FROM contracts WHERE id NOT IN (SELECT id FROM Contract);
  `);
  console.log(`   ✅ ${r.results?.[0]?.response?.result?.affected_row_count || 0} registros`);

  // TokenLedger
  console.log("📋 TokenLedger...");
  r = await exec(`
    INSERT OR IGNORE INTO TokenLedger (id, userId, type, reason, amountTokens, amountEurCents, referenceType, referenceId, txHash, description, metadata, createdAt)
    SELECT id, user_id, type, reason, amount_tokens, amount_eur_cents, reference_type, reference_id, tx_hash, description, metadata, created_at
    FROM token_ledger WHERE id NOT IN (SELECT id FROM TokenLedger);
  `);
  console.log(`   ✅ ${r.results?.[0]?.response?.result?.affected_row_count || 0} registros`);

  // Notification
  console.log("📋 Notification...");
  r = await exec(`
    INSERT OR IGNORE INTO Notification (id, userId, type, title, message, referenceType, referenceId, isRead, readAt, emailSent, pushSent, createdAt)
    SELECT id, user_id, type, title, message, reference_type, reference_id, is_read, read_at, email_sent, push_sent, created_at
    FROM notifications WHERE id NOT IN (SELECT id FROM Notification);
  `);
  console.log(`   ✅ ${r.results?.[0]?.response?.result?.affected_row_count || 0} registros`);

  // ChatRoom
  console.log("📋 ChatRoom...");
  r = await exec(`
    INSERT OR IGNORE INTO ChatRoom (id, type, referenceType, referenceId, isActive, createdAt, updatedAt)
    SELECT id, type, reference_type, reference_id, is_active, created_at, updated_at
    FROM chat_rooms WHERE id NOT IN (SELECT id FROM ChatRoom);
  `);
  console.log(`   ✅ ${r.results?.[0]?.response?.result?.affected_row_count || 0} registros`);

  // ChatParticipant
  console.log("📋 ChatParticipant...");
  r = await exec(`
    INSERT OR IGNORE INTO ChatParticipant (id, chatRoomId, userId, lastReadAt, unreadCount, createdAt)
    SELECT id, chat_room_id, user_id, last_read_at, unread_count, created_at
    FROM chat_participants WHERE id NOT IN (SELECT id FROM ChatParticipant);
  `);
  console.log(`   ✅ ${r.results?.[0]?.response?.result?.affected_row_count || 0} registros`);

  // ChatMessage
  console.log("📋 ChatMessage...");
  r = await exec(`
    INSERT OR IGNORE INTO ChatMessage (id, chatRoomId, senderId, content, messageType, metadata, isEdited, isDeleted, createdAt, updatedAt)
    SELECT id, chat_room_id, sender_id, content, message_type, metadata, is_edited, is_deleted, created_at, updated_at
    FROM chat_messages WHERE id NOT IN (SELECT id FROM ChatMessage);
  `);
  console.log(`   ✅ ${r.results?.[0]?.response?.result?.affected_row_count || 0} registros`);

  // Review
  console.log("📋 Review...");
  r = await exec(`
    INSERT OR IGNORE INTO Review (id, contractId, fromUserId, toUserId, rating, comment, punctualityRating, professionalismRating, communicationRating, qualityRating, isPublic, isModerated, createdAt, updatedAt)
    SELECT id, contract_id, from_user_id, to_user_id, rating, comment, punctuality_rating, professionalism_rating, communication_rating, quality_rating, is_public, is_moderated, created_at, updated_at
    FROM reviews WHERE id NOT IN (SELECT id FROM Review);
  `);
  console.log(`   ✅ ${r.results?.[0]?.response?.result?.affected_row_count || 0} registros`);

  // TermsAcceptance
  console.log("📋 TermsAcceptance...");
  r = await exec(`
    INSERT OR IGNORE INTO TermsAcceptance (id, userId, termsType, termsVersion, ipAddress, userAgent, acceptedAt)
    SELECT id, user_id, terms_type, terms_version, ip_address, user_agent, accepted_at
    FROM terms_acceptances WHERE id NOT IN (SELECT id FROM TermsAcceptance);
  `);
  console.log(`   ✅ ${r.results?.[0]?.response?.result?.affected_row_count || 0} registros`);

  // ContractAcceptance
  console.log("📋 ContractAcceptance...");
  r = await exec(`
    INSERT OR IGNORE INTO ContractAcceptance (id, contractId, acceptedByFamilyAt, familyIpAddress, familyUserAgent, acceptedByCaregiverAt, caregiverIpAddress, caregiverUserAgent, createdAt)
    SELECT id, contract_id, accepted_by_family_at, family_ip_address, family_user_agent, accepted_by_caregiver_at, caregiver_ip_address, caregiver_user_agent, created_at
    FROM contract_acceptance WHERE id NOT IN (SELECT id FROM ContractAcceptance);
  `);
  console.log(`   ✅ ${r.results?.[0]?.response?.result?.affected_row_count || 0} registros`);

  // PlatformSettings
  console.log("📋 PlatformSettings...");
  r = await exec(`
    INSERT OR IGNORE INTO PlatformSettings (id, activationCostEurCents, contractFeeEurCents, platformFeePercent, tokenPriceEurCents, totalReserveEurCents, totalTokensMinted, totalTokensBurned, updatedAt)
    SELECT id, activation_cost_eur_cents, contract_fee_eur_cents, platform_fee_percent, token_price_eur_cents, total_reserve_eur_cents, total_tokens_minted, total_tokens_burned, updated_at
    FROM platform_settings WHERE NOT EXISTS (SELECT 1 FROM PlatformSettings);
  `);
  console.log(`   ✅ ${r.results?.[0]?.response?.result?.affected_row_count || 0} registros`);

  console.log("\n✅ Migração concluída!");
}

main().catch(console.error);
