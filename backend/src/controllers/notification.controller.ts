import { Response } from 'express';
import { prisma } from '../services/db.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

/**
 * GET /api/notifications
 * Query: page, limit, unread (boolean)
 */
export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unread === 'true';

    const where: any = {
      userId: user.userId,
      orgId: user.organizationId,
      ...(unreadOnly ? { read: false } : {})
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: user.userId, read: false } })
    ]);

    res.json({
      notifications,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      unreadCount
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/notifications
 * Create a notification (used by backend internally or frontend for SSE-originated events)
 */
export async function createNotification(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const { type, title, message } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({ error: 'type, title, and message are required.' });
    }

    const notification = await prisma.notification.create({
      data: {
        userId: user.userId,
        orgId: user.organizationId,
        type,
        title,
        message
      }
    });

    res.status(201).json({ success: true, notification });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
export async function markNotificationRead(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const id = String(req.params.id);

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== user.userId) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    await prisma.notification.update({ where: { id }, data: { read: true } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/notifications/read-all
 * Mark all of the current user's notifications as read
 */
export async function markAllNotificationsRead(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    await prisma.notification.updateMany({
      where: { userId: user.userId, read: false },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete a single notification
 */
export async function deleteNotification(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const id = String(req.params.id);

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== user.userId) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    await prisma.notification.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/notifications
 * Clear all notifications for the current user
 */
export async function clearAllNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    await prisma.notification.deleteMany({ where: { userId: user.userId } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
