import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router as apiRouter } from './routes/api.routes.js';
import { hasOpenAIKey } from './config/openai.js';
import { initDatabase } from './services/db.service.js';
import { logger } from './services/logger.service.js';
import { notFound, globalErrorHandler } from './middleware/errorHandler.middleware.js';

dotenv.config();

// ─── Process-level crash guards ───────────────────────────────────────────────
// Prevent the server from crashing silently on unhandled async errors.
process.on('unhandledRejection', (reason: any) => {
  logger.error('[CRASH] Unhandled Promise Rejection — server will continue:', reason);
  // In production you may want: process.exit(1) here and let PM2/Docker restart
});

process.on('uncaughtException', (err: Error) => {
  logger.error('[CRASH] Uncaught Exception — server will attempt to continue:', err);
  // Uncaught exceptions are NOT safe to continue from; log and exit cleanly
  process.exit(1);
});

// ─── JWT Secret validation ─────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  logger.warn(
    '⚠️  [SECURITY] JWT_SECRET is missing or too short (< 32 chars). ' +
    'Set a strong JWT_SECRET env var before deploying to production!'
  );
}

const app = express();
const PORT = Number(process.env.PORT || 5080);

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow specific origins from env; fall back to common dev origins.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:3000,https://dopspilot.chandandev.online,http://dopspilot.chandandev.online')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    logger.warn(`[CORS] Blocked request from origin: ${origin}`);
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 'Authorization',
    'x-server-ssh-key', 'x-server-pass', 'x-github-token'
  ]
}));

// ─── Body parsing — with size limit to prevent payload attacks ─────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

async function startServer() {
  // Initialize SQLite/Prisma database before accepting requests
  await initDatabase();

  // ─── API Routes ──────────────────────────────────────────────────────────────
  app.use('/api', apiRouter);

  // ─── Health check ─────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'OK',
      service: 'D-OpsPilot AI Backend',
      openaiEnabled: hasOpenAIKey(),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  });

  // ─── 404 — must come after all routes ────────────────────────────────────────
  app.use(notFound);

  // ─── Global error handler — must be last, 4-arg signature required ───────────
  app.use(globalErrorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`✅  D-OpsPilot AI Backend running on http://0.0.0.0:${PORT}`);
    logger.info(`🔑  OpenAI API Integration: ${hasOpenAIKey() ? 'ENABLED' : 'FALLBACK MODE'}`);
    logger.info(`🌐  CORS allowed origins: ${allowedOrigins.join(', ')}`);

    // ─── 3-Day Storage Auto-Cleanup Policy (Runs on startup & every 12h) ─────────
    import('./services/repo-clone.service.js').then(({ cleanupInactiveClonedRepos }) => {
      cleanupInactiveClonedRepos(3);
      setInterval(() => {
        cleanupInactiveClonedRepos(3);
      }, 12 * 60 * 60 * 1000);
    }).catch(err => logger.warn('Cleanup scheduler start notice', err));
  });
}

startServer().catch((err) => {
  logger.error('❌  Failed to start D-OpsPilot backend', err);
  process.exit(1);
});
