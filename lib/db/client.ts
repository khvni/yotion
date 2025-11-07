import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema';

// Use a relative path string directly for PGlite
const dbPath = './data/notion.db';

// Create a singleton PGlite client
let client: PGlite | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (db) return db;

  if (!client) {
    client = new PGlite(dbPath);

    // Initialize database schema
    await client.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT,
        cover_image TEXT,
        icon TEXT,
        is_archived BOOLEAN NOT NULL DEFAULT false,
        is_published BOOLEAN NOT NULL DEFAULT false,
        parent_document INTEGER REFERENCES documents(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
