import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getDepartments = async (req: any, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      where: { status: 'ACTIVE' },
      include: {
        head: {
          select: { id: true, name: true, email: true },
        },
        parent: {
          select: { id: true, name: true },
        },
        _count: {
          select: { users: true, assets: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createDepartment = async (req: any, res: Response) => {
  try {
    const { name, headId, parentId } = req.body;

    const existing = await prisma.department.findFirst({
      where: { name, status: 'ACTIVE' },
    });

    if (existing) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    const department = await prisma.department.create({
      data: {
        name,
        headId: headId || null,
        parentId: parentId || null,
      },
      include: {
        head: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entityType: 'Department',
        entityId: department.id,
      },
    });

    return res.status(201).json(department);
  } catch (error) {
    console.error('Create department error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateDepartment = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { name, headId, parentId } = req.body;

    const department = await prisma.department.update({
      where: { id },
      data: {
        name: name || undefined,
        headId: headId !== undefined ? headId : undefined,
        parentId: parentId !== undefined ? parentId : undefined,
      },
      include: {
        head: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entityType: 'Department',
        entityId: id,
      },
    });

    return res.status(200).json(department);
  } catch (error) {
    console.error('Update department error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteDepartment = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.department.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entityType: 'Department',
        entityId: id,
      },
    });

    return res.status(200).json({ message: 'Department deactivated successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
