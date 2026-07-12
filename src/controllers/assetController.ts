import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
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
});

export const uploadMiddleware = upload.single('photo');

export const generateAssetTag = async (): Promise<string> => {
  const lastAsset = await prisma.asset.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { assetTag: true },
  });

  let nextNumber = 1;
  if (lastAsset) {
    const parts = lastAsset.assetTag.split('-');
    if (parts.length === 2) {
      nextNumber = parseInt(parts[1]) + 1;
    }
  }

  return `AF-${String(nextNumber).padStart(4, '0')}`;
};

export const createAsset = async (req: any, res: Response) => {
  try {
    const {
      name,
      description,
      categoryId,
      serialNumber,
      condition,
      location,
      departmentId,
      purchaseDate,
      purchaseCost,
    } = req.body;

    const assetTag = await generateAssetTag();

    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    const asset = await prisma.asset.create({
      data: {
        assetTag,
        name,
        description: description || null,
        categoryId,
        serialNumber: serialNumber || null,
        condition: condition || null,
        location: location || null,
        departmentId: departmentId || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseCost: purchaseCost ? parseFloat(purchaseCost) : null,
        photo,
      },
      include: {
        category: true,
        department: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        entityType: 'Asset',
        entityId: asset.id,
        details: { assetTag: asset.assetTag },
      },
    });

    return res.status(201).json(asset);
  } catch (error) {
    console.error('Create asset error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAssets = async (req: any, res: Response) => {
  try {
    const {
      tag,
      serial,
      categoryId,
      status,
      departmentId,
      location,
      search,
    } = req.query;

    const where: any = {};

    if (tag) where.assetTag = { contains: tag as string };
    if (serial) where.serialNumber = { contains: serial as string };
    if (categoryId) where.categoryId = categoryId as string;
    if (status) where.status = status as string;
    if (departmentId) where.departmentId = departmentId as string;
    if (location) where.location = { contains: location as string };
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { assetTag: { contains: search as string } },
        { serialNumber: { contains: search as string } },
      ];
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        category: true,
        department: true,
        allocations: {
          where: { status: 'ACTIVE' },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(assets);
  } catch (error) {
    console.error('Get assets error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAssetById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        department: true,
        allocations: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
        maintenanceRequests: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        bookings: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    return res.status(200).json(asset);
  } catch (error) {
    console.error('Get asset by id error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAsset = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        condition: data.condition,
        location: data.location,
        departmentId: data.departmentId,
        status: data.status,
        photo: data.photo,
      },
      include: {
        category: true,
        department: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entityType: 'Asset',
        entityId: id,
      },
    });

    return res.status(200).json(asset);
  } catch (error) {
    console.error('Update asset error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const retireAsset = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const asset = await prisma.asset.update({
      where: { id },
      data: { status: 'RETIRED' },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'RETIRE',
        entityType: 'Asset',
        entityId: id,
      },
    });

    return res.status(200).json(asset);
  } catch (error) {
    console.error('Retire asset error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
