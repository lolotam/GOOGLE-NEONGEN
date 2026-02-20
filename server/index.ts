/**
 * NeonGen AI Studio — Express Backend Server
 *
 * Serves the fal.ai LoRA training and image generation API.
 * Runs alongside the Vite frontend dev server.
 *
 * Usage: npm run server (or: npx tsx server/index.ts)
 */
import express from 'express';
import cors from 'cors';
import { fal } from '@fal-ai/client';
import stylesRouter from './routes/styles.js';
import imagesRouter from './routes/images.js';

const PORT = process.env.PORT || 4000;

// Configure fal.ai client with API key from environment
const falKey = process.env.FAL_KEY;
if (!falKey) {
    console.error('❌ FAL_KEY environment variable is required. Set it in .env.local');
    process.exit(1);
}

fal.config({ credentials: falKey });

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routers
app.use('/api/styles', stylesRouter);
app.use('/api/images', imagesRouter);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n⚡ NeonGen API Server running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Styles: http://localhost:${PORT}/api/styles`);
    console.log(`   Images: http://localhost:${PORT}/api/images/generate\n`);
});
