import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const getActivityLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, entityType, action, limit = 100 } = req.query;

    const where: any = {};
    if (userId) where.userId = userId as string;
    if (entityType) where.entityType = entityType as string;
    if (action) where.action = action as string;

    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    return res.status(200).json(logs);
  } catch (error) {
    console.error('Get activity logs error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
