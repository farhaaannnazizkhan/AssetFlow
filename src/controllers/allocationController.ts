import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { AssetStatusType } from '../types';

export const createAllocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assetId, userId, expectedReturnDate, conditionNotes } = req.body;

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        allocations: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const activeAllocation = asset.allocations.find(a => a.status === 'ACTIVE');

    if (activeAllocation) {
      const holder = await prisma.user.findUnique({
        where: { id: activeAllocation.userId },
        select: { id: true, name: true, email: true },
      });

      return res.status(409).json({
        message: `Currently held by ${holder?.name || 'unknown'}`,
        holderName: holder?.name,
        holderId: holder?.id,
        offerTransfer: true,
        allocationId: activeAllocation.id,
      });
    }

    if (asset.status !== 'AVAILABLE' && asset.status !== 'RESERVED') {
      return res.status(409).json({
        message: `Asset is not available for allocation. Current status: ${asset.status}`,
        offerTransfer: false,
      });
    }

    const allocation = await prisma.allocation.create({
      data: {
        assetId,
        userId,
        allocatedBy: req.user!.id,
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
        conditionNotes: conditionNotes || null,
      },
      include: {
        asset: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.asset.update({
      where: { id: assetId },
      data: { status: 'ALLOCATED', currentHolderId: userId },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: 'ALLOCATION',
        message: `Asset ${asset.assetTag} (${asset.name}) has been allocated to you.`,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'ALLOCATE',
        entityType: 'Allocation',
        entityId: allocation.id,
        details: { assetId, assetTag: asset.assetTag },
      },
    });

    return res.status(201).json(allocation);
  } catch (error) {
    console.error('Create allocation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const returnAsset = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { conditionNotes } = req.body;

    const allocation = await prisma.allocation.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    if (allocation.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Allocation is not active' });
    }

    const updatedAllocation = await prisma.allocation.update({
      where: { id },
      data: {
        status: 'RETURNED',
        returnedAt: new Date(),
        conditionNotes: conditionNotes || allocation.conditionNotes,
      },
    });

    await prisma.asset.update({
      where: { id: allocation.assetId },
      data: { status: 'AVAILABLE', currentHolderId: null },
    });

    await prisma.notification.create({
      data: {
        userId: allocation.userId,
        type: 'ALLOCATION',
        message: `Asset ${allocation.asset.assetTag} has been returned.`,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'RETURN',
        entityType: 'Allocation',
        entityId: id,
      },
    });

    return res.status(200).json(updatedAllocation);
  } catch (error) {
    console.error('Return asset error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getActiveAllocations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, assetId } = req.query;

    const where: any = { status: 'ACTIVE' };
    if (userId) where.userId = userId as string;
    if (assetId) where.assetId = assetId as string;

    const allocations = await prisma.allocation.findMany({
      where,
      include: {
        asset: { select: { id: true, assetTag: true, name: true, status: true } },
        user: { select: { id: true, name: true, email: true, department: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(allocations);
  } catch (error) {
    console.error('Get active allocations error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllAllocations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allocations = await prisma.allocation.findMany({
      include: {
        asset: { select: { id: true, assetTag: true, name: true, status: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(allocations);
  } catch (error) {
    console.error('Get all allocations error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
