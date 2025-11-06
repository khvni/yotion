import express from 'express';
import cors from 'cors';
import { runMigrations } from './db/migrate.js';
import documentsRoutes from './routes/documents.js';
import blocksRoutes from './routes/blocks.js';
import { errorHandler } from './middleware/errorHandler.js';
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Noto server is running' });
});
// API routes
app.use('/api/documents', documentsRoutes);
app.use('/api/blocks', blocksRoutes);
// Error handler (must be last)
app.use(errorHandler);
// Initialize database
async function startServer() {
    try {
        await runMigrations();
        // Seed database if empty (only on first run)
        // You can add a check here to avoid re-seeding
        // await seed();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
