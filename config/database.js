import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

export const initDatabase = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      google_id TEXT UNIQUE,
      access_token TEXT,
      refresh_token TEXT,
      token_expiry INTEGER,
      default_tone TEXT DEFAULT 'pro',
      relance_frequency TEXT DEFAULT 'weekly',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Contacts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      last_contacted_at INTEGER,
      interaction_count INTEGER DEFAULT 0,
      priority INTEGER DEFAULT 0,
      is_ignored INTEGER DEFAULT 0,
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, email)
    )
  `);

  // Relances history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS relances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      tone TEXT,
      sent_at INTEGER DEFAULT (strftime('%s', 'now')),
      status TEXT DEFAULT 'sent',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Database initialized');
};

export default db;