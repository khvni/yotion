import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Create a singleton SQLite client
let client: Database.Database | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (db) return db;

  if (!client) {
    // Use a simple path for SQLite database file
    const dbPath = path.join(process.cwd(), 'data', 'notion.db');

    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    client = new Database(dbPath);

    // CRITICAL: Enable foreign key constraints for this connection
    // This must be set on EVERY connection as it's not persisted in the database
    // Without this, child documents will become orphaned when parent documents are deleted
    client.pragma('foreign_keys = ON');

    // Verify foreign keys are enabled
    const fkEnabled = client.pragma('foreign_keys', { simple: true });
    if (fkEnabled !== 1) {
      throw new Error('Failed to enable foreign key constraints');
    }

    // Initialize database schema
    client.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT,
        cover_image TEXT,
        icon TEXT,
        is_archived INTEGER NOT NULL DEFAULT 0,
        is_published INTEGER NOT NULL DEFAULT 0,
        parent_document INTEGER REFERENCES documents(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
      CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_document);
      CREATE INDEX IF NOT EXISTS idx_documents_archived ON documents(is_archived);
    `);
  }

  db = drizzle(client, { schema });
  return db;
}

export { client };
