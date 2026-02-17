import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Only create PrismaClient if DATABASE_URL is set and not SQLite (file:)
const hasValidDatabase = process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')

export const db = hasValidDatabase
  ? (globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    }))
  : null as unknown as PrismaClient // Type cast for compatibility

if (process.env.NODE_ENV !== 'production' && hasValidDatabase) {
  globalForPrisma.prisma = db as PrismaClient
}
