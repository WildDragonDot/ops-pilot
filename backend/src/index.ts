import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router as apiRouter } from './routes/api.routes.js';
import { hasOpenAIKey } from './config/openai.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'OpsPilot AI Backend',
    openaiEnabled: hasOpenAIKey(),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 OpsPilot AI Backend running on http://0.0.0.0:${PORT}`);
  console.log(`🤖 OpenAI API Integration: ${hasOpenAIKey() ? 'ENABLED (GPT-4o / Codex)' : 'FALLBACK MODE (Set OPENAI_API_KEY in .env)'}`);
});
