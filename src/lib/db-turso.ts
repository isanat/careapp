import { createClient, type Client } from '@libsql/client';

// Check if we're using Turso (production) or local SQLite
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;
const databaseUrl = process.env.DATABASE_URL;

const isTurso = !!(tursoUrl && tursoToken);
const hasLocalDb = !!databaseUrl;
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

let db: Client;

// Log for debugging
console.log('📦 Database config:', {
  isTurso,
  hasLocalDb,
  isBuildTime,
  tursoUrl: tursoUrl ? tursoUrl.substring(0, 30) + '...' : 'not set',
  hasToken: !!tursoToken,
  databaseUrl: databaseUrl ? databaseUrl.substring(0, 30) + '...' : 'not set',
});

if (isTurso) {
  // Turso connection (production)
  db = createClient({
    url: tursoUrl!,
    authToken: tursoToken!,
  });
  console.log('✅ Connected to Turso database');
} else if (hasLocalDb) {
  // Local SQLite connection (development)
  db = createClient({
    url: databaseUrl!,
  });
  console.log('✅ Connected to local SQLite database');
} else if (isBuildTime) {
  // During build time without database credentials, create a mock client
  console.log('⚠️ Build mode: Using mock database client');
  db = {
    execute: async () => ({ rows: [], columns: [], rowsAffected: 0, lastInsertRowid: undefined }),
    batch: async () => [],
    transaction: async () => ({ execute: async () => ({ rows: [], columns: [], rowsAffected: 0, lastInsertRowid: undefined }) }),
    close: async () => {},
    sync: async () => {},
  } as unknown as Client;
} else {
  // No database configured - this is an error state
  console.error('❌ CRITICAL: No database configured!');
  console.error('Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN for production');
  console.error('Or set DATABASE_URL for local development');
  
  // Create a mock client that throws errors
  db = {
    execute: async () => {
      throw new Error('Database not configured. Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.');
    },
    batch: async () => {
      throw new Error('Database not configured. Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.');
    },
    transaction: async () => ({ 
      execute: async () => {
        throw new Error('Database not configured. Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.');
      }
    }),
    close: async () => {},
    sync: async () => {},
  } as unknown as Client;
}

export { db };
