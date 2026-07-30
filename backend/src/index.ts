import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router as apiRouter } from './routes/api.routes.js';
import { hasOpenAIKey } from './config/openai.js';
import { initDatabase } from './services/db.service.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5080);

app.use(cors());
app.use(express.json());

// Initialize SQLite/Prisma file database seed
initDatabase();

// API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'D-OpsPilot AI Backend',
    openaiEnabled: hasOpenAIKey(),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 D-OpsPilot AI Backend running on http://0.0.0.0:${PORT}`);
  console.log(`🤖 OpenAI API Integration: ${hasOpenAIKey() ? 'ENABLED (GPT-4o / Codex)' : 'FALLBACK MODE'}`);
});
