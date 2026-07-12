import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { unreadOnly } = req.query;

    const where: any = { userId: req.user!.id };
    if (unreadOnly === 'true') where.read = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, read: false },
    });

    return res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return res.status(200).json(notification);
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });

    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
