import { createClient, type Client } from '@libsql/client';

// Check if we're using Turso (production) or local SQLite
const isTurso = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;

let db: Client;

if (isTurso) {
  // Turso connection (production)
  db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  console.log('📦 Connected to Turso database');
} else {
  // Local SQLite connection (development)
  db = createClient({
    url: process.env.DATABASE_URL || 'file:./db/custom.db',
  });
  console.log('📦 Connected to local SQLite database');
}

export { db };
