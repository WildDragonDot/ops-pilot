import { Request, Response } from 'express';

const sseClients: Response[] = [];

export function eventStreamHandler(req: Request, res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);

  // Send initial connected ping
  res.write(`data: ${JSON.stringify({ type: 'info', title: 'Live Stream Connected', message: 'OpsPilot AI Real-time Event Stream Active' })}\n\n`);

  req.on('close', () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
}

export function broadcastEvent(event: { type: 'success' | 'warning' | 'danger' | 'info'; title: string; message: string }) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(payload);
    } catch (err) {
      // Client closed
    }
  });
}
