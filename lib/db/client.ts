import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema';
import path from 'path';

// Initialize PGlite with file-based storage in the data directory
const dbPath = path.join(process.cwd(), 'data', 'notion.db');

// Create a singleton PGlite client
let client: PGlite | null = null;

export function getClient(): PGlite {
  if (!client) {
    client = new PGlite(dbPath);
  }
  return client;
}

// Create Drizzle instance with schema
export const db = drizzle(getClient(), { schema });

// Export client for migrations and raw queries
export { client };
