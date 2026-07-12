import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getEmployees = async (req: any, res: Response) => {
  try {
    const { departmentId, status } = req.query;

    const where: any = {
      role: { not: 'ADMIN' },
    };

    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        departmentId: true,
        department: {
          select: { id: true, name: true },
        },
        phone: true,
        photo: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error('Get employees error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEmployeeRole = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['DEPARTMENT_HEAD', 'ASSET_MANAGER', 'AUDITOR', 'EMPLOYEE'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: role as any },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        departmentId: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_ROLE',
        entityType: 'User',
        entityId: id,
        details: { newRole: role },
      },
    });

    await prisma.notification.create({
      data: {
        userId: id,
        type: 'SYSTEM',
        message: `Your role has been updated to ${role}`,
      },
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error('Update employee role error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEmployeeStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { status: status as any },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_STATUS',
        entityType: 'User',
        entityId: id,
        details: { newStatus: status },
      },
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error('Update employee status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
