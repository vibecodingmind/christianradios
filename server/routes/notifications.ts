import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, type AuthenticatedRequest } from '../auth.js';

export const notificationsRouter = Router();

// 1. Get notifications for the current authenticated user
// Supports: ?unreadOnly=true, ?type=SONG_REQUEST, ?limit=50, ?offset=0
notificationsRouter.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const unreadOnly = req.query.unreadOnly === 'true';
    const type = req.query.type ? String(req.query.type) : undefined;
    const limit = req.query.limit ? Math.max(1, Math.min(100, parseInt(String(req.query.limit), 10))) : 50;
    const offset = req.query.offset ? Math.max(0, parseInt(String(req.query.offset), 10)) : 0;

    const allUserNotifications = db.notifications.getByUserId(userId, { unreadOnly, type });
    const total = allUserNotifications.length;
    const notifications = allUserNotifications.slice(offset, offset + limit);
    const unreadCount = db.notifications.getUnreadCount(userId);

    res.json({
      success: true,
      notifications,
      unreadCount,
      total,
      limit,
      offset,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// 2. Get unread count only (lightweight polling endpoint)
notificationsRouter.get('/unread-count', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const unreadCount = db.notifications.getUnreadCount(userId);
    res.json({ success: true, unreadCount });
  } catch {
    res.status(500).json({ error: 'Failed to retrieve unread notification count.' });
  }
});

// 3. Mark a specific notification as read
notificationsRouter.post('/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updated = db.notifications.markRead(id, userId);

    if (!updated) {
      res.status(404).json({ error: 'Notification not found or access denied.' });
      return;
    }

    const unreadCount = db.notifications.getUnreadCount(userId);
    res.json({ success: true, unreadCount });
  } catch {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// 4. Mark all notifications as read for current user
notificationsRouter.post('/mark-all-read', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const count = db.notifications.markAllRead(userId);
    res.json({ success: true, markedCount: count, unreadCount: 0 });
  } catch {
    res.status(500).json({ error: 'Failed to mark all notifications as read.' });
  }
});

// 5. Delete a specific notification
notificationsRouter.delete('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const deleted = db.notifications.delete(id, userId);

    if (!deleted) {
      res.status(404).json({ error: 'Notification not found or access denied.' });
      return;
    }

    const unreadCount = db.notifications.getUnreadCount(userId);
    res.json({ success: true, unreadCount });
  } catch {
    res.status(500).json({ error: 'Failed to delete notification.' });
  }
});

// 6. Clear all notifications for user
notificationsRouter.delete('/', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const cleared = db.notifications.clearAll(userId);
    res.json({ success: true, clearedCount: cleared, unreadCount: 0 });
  } catch {
    res.status(500).json({ error: 'Failed to clear notifications.' });
  }
});

// Clear all alias for POST clients
notificationsRouter.post('/clear', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const cleared = db.notifications.clearAll(userId);
    res.json({ success: true, clearedCount: cleared, unreadCount: 0 });
  } catch {
    res.status(500).json({ error: 'Failed to clear notifications.' });
  }
});
