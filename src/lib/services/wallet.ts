import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import { db } from "@/lib/db";

const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || "default-encryption-key-change-in-production";

export interface WalletData {
  address: string;
  encryptedPrivateKey: string;
  salt: string;
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
 * Create wallet for user in database
 */
export async function createUserWallet(userId: string): Promise<{
  id: string;
  address: string;
}> {
  // Check if user already has wallet
  const existingWallet = await db.wallet.findUnique({
    where: { userId },
  });

  if (existingWallet) {
    return {
      id: existingWallet.id,
      address: existingWallet.address,
    };
  }

  // Generate new wallet
  const walletData = generateWallet();

  // Create wallet in database
  const wallet = await db.wallet.create({
    data: {
      userId,
      address: walletData.address,
      encryptedPrivateKey: walletData.encryptedPrivateKey,
      salt: walletData.salt,
      balanceTokens: 0,
      balanceEurCents: 0,
      walletType: "custodial",
      isExported: false,
    },
  });

  return {
    id: wallet.id,
    address: wallet.address,
  };
}

/**
 * Get user wallet
 */
export async function getUserWallet(userId: string) {
  return db.wallet.findUnique({
    where: { userId },
  });
}

/**
 * Update wallet balance
 */
export async function updateWalletBalance(
  walletId: string,
  tokensDelta: number,
  eurCentsDelta: number
) {
  const wallet = await db.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  return db.wallet.update({
    where: { id: walletId },
    data: {
      balanceTokens: wallet.balanceTokens + tokensDelta,
      balanceEurCents: wallet.balanceEurCents + eurCentsDelta,
    },
  });
}

/**
 * Get wallet balance in EUR (current token price)
 */
export async function getWalletBalanceEur(userId: string): Promise<{
  tokens: number;
  eurCents: number;
  tokenPriceEurCents: number;
}> {
  const wallet = await db.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    return {
      tokens: 0,
      eurCents: 0,
      tokenPriceEurCents: 100, // Default: 1 token = 0.01 EUR
    };
  }

  // Get current token price from platform settings
  const settings = await db.platformSettings.findFirst();
  const tokenPriceEurCents = settings?.tokenPriceEurCents || 100;

  return {
    tokens: wallet.balanceTokens,
    eurCents: wallet.balanceEurCents,
    tokenPriceEurCents,
  };
}
