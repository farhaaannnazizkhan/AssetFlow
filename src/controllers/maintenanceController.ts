import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'maintenance-' + uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
}).single('photo');

export const createMaintenanceRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assetId, description, priority } = req.body;

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    const maintenance = await prisma.maintenanceRequest.create({
      data: {
        assetId,
        requestedBy: req.user!.id,
        description,
        priority: priority || 'MEDIUM',
        photo,
      },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const managers = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'ASSET_MANAGER'] }, status: 'ACTIVE' },
      select: { id: true },
    });

    for (const manager of managers) {
      await prisma.notification.create({
        data: {
          userId: manager.id,
          type: 'MAINTENANCE_REQUEST',
          message: `New maintenance request for asset ${asset.assetTag} (${asset.name}).`,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE_MAINTENANCE',
        entityType: 'MaintenanceRequest',
        entityId: maintenance.id,
      },
    });

    return res.status(201).json(maintenance);
  } catch (error) {
    console.error('Create maintenance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const approveMaintenance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const maintenance = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    if (maintenance.status !== 'REQUESTED') {
      return res.status(400).json({ message: 'Maintenance request is not in REQUESTED status' });
    }

    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: req.user!.id,
      },
    });

    await prisma.asset.update({
      where: { id: maintenance.assetId },
      data: { status: 'UNDER_MAINTENANCE' },
    });

    await prisma.notification.create({
      data: {
        userId: maintenance.requestedBy,
        type: 'MAINTENANCE_APPROVED',
        message: `Maintenance request for ${maintenance.asset.name} has been approved.`,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'APPROVE_MAINTENANCE',
        entityType: 'MaintenanceRequest',
        entityId: id,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Approve maintenance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const rejectMaintenance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const maintenance = await prisma.maintenanceRequest.findUnique({
      where: { id },
    });

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    await prisma.notification.create({
      data: {
        userId: maintenance.requestedBy,
        type: 'MAINTENANCE_APPROVED',
        message: `Maintenance request for asset has been rejected.`,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'REJECT_MAINTENANCE',
        entityType: 'MaintenanceRequest',
        entityId: id,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Reject maintenance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const resolveMaintenance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const maintenance = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    await prisma.asset.update({
      where: { id: maintenance.assetId },
      data: { status: 'AVAILABLE' },
    });

    await prisma.notification.create({
      data: {
        userId: maintenance.requestedBy,
        type: 'MAINTENANCE_RESOLVED',
        message: `Maintenance for ${maintenance.asset.name} has been resolved.`,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'RESOLVE_MAINTENANCE',
        entityType: 'MaintenanceRequest',
        entityId: id,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Resolve maintenance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMaintenanceRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, assetId } = req.query;

    const where: any = {};
    if (status) where.status = status as string;
    if (assetId) where.assetId = assetId as string;

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        asset: { select: { id: true, assetTag: true, name: true, status: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(requests);
  } catch (error) {
    console.error('Get maintenance requests error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
