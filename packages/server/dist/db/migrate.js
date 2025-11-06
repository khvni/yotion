import { migrate } from 'drizzle-orm/pglite/migrator';
import { db } from './client.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function runMigrations() {
    console.log('Running migrations...');
    try {
        await migrate(db, {
            migrationsFolder: path.join(__dirname, '../../drizzle'),
        });
        console.log('Migrations completed successfully!');
    }
    catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}
