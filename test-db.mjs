import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

// Load env
const envContent = readFileSync(".env.local", "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (match) env[match[1]] = match[2];
}

const db = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

// Check existing tables
const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
console.log("=== TABLES IN DB ===");
tables.rows.forEach(r => console.log(" -", r.name));

// Check existing users
const users = await db.execute("SELECT id, name, email, role, status, phone FROM User LIMIT 10");
console.log("\n=== EXISTING USERS ===");
users.rows.forEach(r => console.log(` - ${r.name} (${r.email}) role=${r.role} status=${r.status} phone=${r.phone}`));

// Check schema of key tables
for (const table of ["User", "ProfileFamily", "ProfileCaregiver", "Wallet", "Contract", "TokenLedger", "AdminAction", "ChatMessage", "Notification", "EscrowPayment"]) {
  try {
    const info = await db.execute(`PRAGMA table_info(${table})`);
    console.log(`\n=== ${table} columns ===`);
    info.rows.forEach(r => console.log(`  ${r.name} (${r.type}) ${r.notnull ? 'NOT NULL' : 'nullable'} ${r.pk ? 'PK' : ''}`));
  } catch (e) {
    console.log(`\n=== ${table}: TABLE NOT FOUND ===`);
  }
}

process.exit(0);
