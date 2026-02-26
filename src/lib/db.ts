import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if we're in build time without a valid database
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
const hasValidDatabase = process.env.DATABASE_URL && 
  !process.env.DATABASE_URL.startsWith('file:') && 
  !isBuildTime;

// Create a mock PrismaClient for build time
const createMockPrismaClient = (): PrismaClient => {
  return new Proxy({} as PrismaClient, {
    get: () => () => Promise.resolve(null),
  });
};

export const db = hasValidDatabase
  ? (globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    }))
  : createMockPrismaClient();

if (process.env.NODE_ENV !== 'production' && hasValidDatabase) {
  globalForPrisma.prisma = db as PrismaClient
}
