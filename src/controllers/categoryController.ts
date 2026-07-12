import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getCategories = async (req: any, res: Response) => {
  try {
    const categories = await prisma.assetCategory.findMany({
      where: { status: 'ACTIVE' },
      include: {
        _count: {
          select: { assets: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCategory = async (req: any, res: Response) => {
  try {
    const { name, customFields } = req.body;

    const existing = await prisma.assetCategory.findFirst({
      where: { name, status: 'ACTIVE' },
    });

    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await prisma.assetCategory.create({
      data: {
        name,
        customFields: customFields || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entityType: 'AssetCategory',
        entityId: category.id,
      },
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCategory = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { name, customFields } = req.body;

    const category = await prisma.assetCategory.update({
      where: { id },
      data: {
        name: name || undefined,
        customFields: customFields !== undefined ? customFields : undefined,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entityType: 'AssetCategory',
        entityId: id,
      },
    });

    return res.status(200).json(category);
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCategory = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.assetCategory.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        entityType: 'AssetCategory',
        entityId: id,
      },
    });

    return res.status(200).json({ message: 'Category deactivated successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
