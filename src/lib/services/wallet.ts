import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import { db } from "@/lib/db-turso";

const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || "default-encryption-key-change-in-production";

export interface WalletData {
  address: string;
  encryptedPrivateKey: string;
  salt: string;
}

export interface WalletRecord {
  id: string;
  userId: string;
  address: string;
  encryptedPrivateKey: string | null;
  salt: string | null;
  balanceTokens: number;
  balanceEurCents: number;
  walletType: string;
  isExported: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Generate a new Ethereum wallet
 */
export function generateWallet(): WalletData {
  // Generate random wallet
  const wallet = ethers.Wallet.createRandom();
  
  // Generate salt for encryption
  const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
  
  // Encrypt private key
  const encryptedPrivateKey = CryptoJS.AES.encrypt(
    wallet.privateKey,
    ENCRYPTION_KEY + salt
  ).toString();

  return {
    address: wallet.address,
    encryptedPrivateKey,
    salt,
  };
}

/**
 * Decrypt private key (for exporting or signing transactions)
 */
export function decryptPrivateKey(
  encryptedPrivateKey: string,
  salt: string
): string {
  const bytes = CryptoJS.AES.decrypt(
    encryptedPrivateKey,
    ENCRYPTION_KEY + salt
  );
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Generate a unique CUID-like ID
 */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${randomPart}`;
}

/**
 * Create wallet for user in database
 */
export async function createUserWallet(userId: string): Promise<{
  id: string;
  address: string;
}> {
  // Check if user already has wallet
  const existingWalletResult = await db.execute({
    sql: `SELECT id, address FROM wallets WHERE user_id = ?`,
    args: [userId],
  });

  if (existingWalletResult.rows.length > 0) {
    const existingWallet = existingWalletResult.rows[0];
    return {
      id: existingWallet.id as string,
      address: existingWallet.address as string,
    };
  }

  // Generate new wallet
  const walletData = generateWallet();
  const walletId = generateId();
  const now = new Date().toISOString();

  // Create wallet in database
  await db.execute({
    sql: `INSERT INTO wallets (
      id, 
      user_id, 
      address, 
      encrypted_private_key, 
      salt, 
      balance_tokens, 
      balance_eur_cents, 
      wallet_type, 
      is_exported, 
      created_at, 
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      walletId,
      userId,
      walletData.address,
      walletData.encryptedPrivateKey,
      walletData.salt,
      0,
      0,
      "custodial",
      0, // SQLite uses 0/1 for boolean
      now,
      now,
    ],
  });

  return {
    id: walletId,
    address: walletData.address,
  };
}

/**
 * Get user wallet
 */
export async function getUserWallet(userId: string): Promise<WalletRecord | null> {
  const result = await db.execute({
    sql: `SELECT 
      id, 
      user_id, 
      address, 
      encrypted_private_key, 
      salt, 
      balance_tokens, 
      balance_eur_cents, 
      wallet_type, 
      is_exported, 
      created_at, 
      updated_at
    FROM wallets 
    WHERE user_id = ?`,
    args: [userId],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id as string,
    userId: row.user_id as string,
    address: row.address as string,
    encryptedPrivateKey: row.encrypted_private_key as string | null,
    salt: row.salt as string | null,
    balanceTokens: Number(row.balance_tokens) || 0,
    balanceEurCents: Number(row.balance_eur_cents) || 0,
    walletType: row.wallet_type as string,
    isExported: Boolean(row.is_exported),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Update wallet balance
 */
export async function updateWalletBalance(
  walletId: string,
  tokensDelta: number,
  eurCentsDelta: number
): Promise<WalletRecord> {
  // First check if wallet exists
  const walletResult = await db.execute({
    sql: `SELECT 
      id, 
      user_id, 
      address, 
      encrypted_private_key, 
      salt, 
      balance_tokens, 
      balance_eur_cents, 
      wallet_type, 
      is_exported, 
      created_at, 
      updated_at
    FROM wallets 
    WHERE id = ?`,
    args: [walletId],
  });

  if (walletResult.rows.length === 0) {
    throw new Error("Wallet not found");
  }

  const now = new Date().toISOString();

  // Update the wallet balance
  await db.execute({
    sql: `UPDATE wallets 
    SET balance_tokens = balance_tokens + ?, 
        balance_eur_cents = balance_eur_cents + ?, 
        updated_at = ? 
    WHERE id = ?`,
    args: [tokensDelta, eurCentsDelta, now, walletId],
  });

  // Fetch the updated wallet
  const updatedResult = await db.execute({
    sql: `SELECT 
      id, 
      user_id, 
      address, 
      encrypted_private_key, 
      salt, 
      balance_tokens, 
      balance_eur_cents, 
      wallet_type, 
      is_exported, 
      created_at, 
      updated_at
    FROM wallets 
    WHERE id = ?`,
    args: [walletId],
  });

  const row = updatedResult.rows[0];
  return {
    id: row.id as string,
    userId: row.user_id as string,
    address: row.address as string,
    encryptedPrivateKey: row.encrypted_private_key as string | null,
    salt: row.salt as string | null,
    balanceTokens: Number(row.balance_tokens) || 0,
    balanceEurCents: Number(row.balance_eur_cents) || 0,
    walletType: row.wallet_type as string,
    isExported: Boolean(row.is_exported),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Get wallet balance in EUR (current token price)
 */
export async function getWalletBalanceEur(userId: string): Promise<{
  tokens: number;
  eurCents: number;
  tokenPriceEurCents: number;
}> {
  const walletResult = await db.execute({
    sql: `SELECT balance_tokens, balance_eur_cents FROM wallets WHERE user_id = ?`,
    args: [userId],
  });

  if (walletResult.rows.length === 0) {
    return {
      tokens: 0,
      eurCents: 0,
      tokenPriceEurCents: 100, // Default: 1 token = 0.01 EUR
    };
  }

  const wallet = walletResult.rows[0];

  // Get current token price from platform settings
  const settingsResult = await db.execute({
    sql: `SELECT token_price_eur_cents FROM platform_settings LIMIT 1`,
    args: [],
  });

  const tokenPriceEurCents = settingsResult.rows.length > 0
    ? Number(settingsResult.rows[0].token_price_eur_cents) || 100
    : 100;

  return {
    tokens: Number(wallet.balance_tokens) || 0,
    eurCents: Number(wallet.balance_eur_cents) || 0,
    tokenPriceEurCents,
  };
}
