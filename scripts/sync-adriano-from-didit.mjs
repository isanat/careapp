#!/usr/bin/env node

/**
 * Script to sync ADRIANO user from Didit KYC data
 * This creates the user in the database with all approved KYC information
 *
 * Usage:
 *   node scripts/sync-adriano-from-didit.mjs [admin_key]
 */

import fetch from 'node-fetch';

const adminKey = process.argv[2] || process.env.ADMIN_API_KEY || 'dev-admin-key';
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

const adrianoData = {
  email: 'netlinkassist@gmail.com',
  firstName: 'Adriano',
  lastName: 'Moreira da Silva',
  birthDate: '1976-05-01', // 1 de maio de 1976
  nationality: 'BRA',
  documentNumber: '01536294680',
  documentType: 'driver_license',
  documentIssuer: 'Detran-SP',
  documentIssueDate: '2000-05-26', // 5 de dezembro de 2000
  documentExpiryDate: '2025-12-05', // 5 de dezembro de 2025
  kycSessionId: '145187c2-56e1-4636-8efd-bf54713c11e2',
  role: 'CAREGIVER'
};

async function syncUser() {
  try {
    console.log('🔄 Sincronizando usuário ADRIANO do Didit...\n');
    console.log('Dados:');
    console.log(`  Email: ${adrianoData.email}`);
    console.log(`  Nome: ${adrianoData.firstName} ${adrianoData.lastName}`);
    console.log(`  Data de Nascimento: ${adrianoData.birthDate}`);
    console.log(`  Nacionalidade: ${adrianoData.nationality}`);
    console.log(`  Documento: ${adrianoData.documentType}`);
    console.log(`  Validade: ${adrianoData.documentExpiryDate}`);
    console.log(`  KYC Session: ${adrianoData.kycSessionId}`);
    console.log('');

    const response = await fetch(`${baseUrl}/api/admin/sync-didit-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`
      },
      body: JSON.stringify(adrianoData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Erro ao sincronizar:');
      console.error(`  Status: ${response.status}`);
      console.error(`  Erro: ${result.error}`);
      process.exit(1);
    }

    console.log('✅ Usuário sincronizado com sucesso!');
    console.log(`  Ação: ${result.action}`);
    console.log(`  User ID: ${result.userId}`);
    console.log(`  Email: ${result.email}`);
    console.log(`  Status KYC: VERIFIED`);
    console.log(`  Status Conta: ACTIVE`);
    console.log(`\n📱 O usuário pode fazer login imediatamente!`);
    console.log(`   Email: ${adrianoData.email}`);

  } catch (error) {
    console.error('❌ Erro de conexão:');
    console.error(`  ${error.message}`);
    console.error(`\n💡 Certifique-se que:`);
    console.error(`  1. O servidor está rodando em ${baseUrl}`);
    console.error(`  2. O banco de dados está acessível`);
    console.error(`  3. A chave de admin está correta`);
    process.exit(1);
  }
}

syncUser();
