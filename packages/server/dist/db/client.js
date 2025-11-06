import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Initialize PGlite with file-based storage
const dbPath = path.join(__dirname, '../../data/noto.db');
const client = new PGlite(dbPath);
// Create Drizzle instance
export const db = drizzle(client, { schema });
// Export client for migrations
export { client };
