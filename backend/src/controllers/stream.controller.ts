import { Request, Response } from 'express';
import { verifyJwtToken } from '../services/auth.service.js';

// Track active SSE clients as a Set for O(1) remove
const sseClients = new Set<Response>();

export function eventStreamHandler(req: Request, res: Response) {
  // ── Authenticate SSE connection via token query param or Authorization header ──
  const tokenFromQuery = req.query.token as string | undefined;
  const authHeader = req.headers.authorization;
  const token = tokenFromQuery || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined);

  if (!token) {
    res.status(401).json({ error: 'Authentication required for event stream.' });
    return;
  }

  try {
    verifyJwtToken(token);
  } catch {
    res.status(401).json({ error: 'Invalid or expired token for event stream.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);

  // Send initial connected ping
  res.write(`data: ${JSON.stringify({ type: 'info', title: 'Live Stream Connected', message: 'D-OpsPilot AI Real-time Event Stream Active' })}\n\n`);

  // Keep-alive heartbeat every 25s to prevent proxy timeouts
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
}

export function broadcastEvent(event: { type: 'success' | 'warning' | 'danger' | 'info'; title: string; message: string }) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  const dead: Response[] = [];

  sseClients.forEach(client => {
    try {
      client.write(payload);
    } catch {
      // Mark dead clients for removal
      dead.push(client);
    }
  });

  // Clean up dead clients
  dead.forEach(c => sseClients.delete(c));
}
