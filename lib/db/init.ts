import { getClient } from './client';

let initialized = false;

export async function initDatabase(): Promise<void> {
  if (initialized) {
    return;
  }

  const client = getClient();

  // Create documents table
  await client.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      title TEXT NOT NULL,
      user_id TEXT NOT NULL,
      is_archived BOOLEAN NOT NULL DEFAULT false,
      parent_document INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      content TEXT,
      cover_image TEXT,
      icon TEXT,
      is_published BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes for efficient queries
  await client.exec(`
    CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
    CREATE INDEX IF NOT EXISTS idx_documents_user_parent ON documents(user_id, parent_document);
    CREATE INDEX IF NOT EXISTS idx_documents_is_archived ON documents(is_archived);
  `);

  initialized = true;
}
