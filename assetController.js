"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retireAsset = exports.updateAsset = exports.getAssetById = exports.getAssets = exports.createAsset = exports.generateAssetTag = exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    },
});
exports.uploadMiddleware = upload.single('photo');
const generateAssetTag = async () => {
    const lastAsset = await prisma_1.default.asset.findFirst({
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
exports.generateAssetTag = generateAssetTag;
const createAsset = async (req, res) => {
    try {
        const { name, description, categoryId, serialNumber, condition, location, departmentId, purchaseDate, purchaseCost, } = req.body;
        const assetTag = await (0, exports.generateAssetTag)();
        const photo = req.file ? `/uploads/${req.file.filename}` : null;
        const asset = await prisma_1.default.asset.create({
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
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'CREATE',
                entityType: 'Asset',
                entityId: asset.id,
                details: { assetTag: asset.assetTag },
            },
        });
        return res.status(201).json(asset);
    }
    catch (error) {
        console.error('Create asset error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createAsset = createAsset;
const getAssets = async (req, res) => {
    try {
        const { tag, serial, categoryId, status, departmentId, location, search, } = req.query;
        const where = {};
        if (tag)
            where.assetTag = { contains: tag };
        if (serial)
            where.serialNumber = { contains: serial };
        if (categoryId)
            where.categoryId = categoryId;
        if (status)
            where.status = status;
        if (departmentId)
            where.departmentId = departmentId;
        if (location)
            where.location = { contains: location };
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { assetTag: { contains: search } },
                { serialNumber: { contains: search } },
            ];
        }
        const assets = await prisma_1.default.asset.findMany({
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
    }
    catch (error) {
        console.error('Get assets error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAssets = getAssets;
const getAssetById = async (req, res) => {
    try {
        const { id } = req.params;
        const asset = await prisma_1.default.asset.findUnique({
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
    }
    catch (error) {
        console.error('Get asset by id error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAssetById = getAssetById;
const updateAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const asset = await prisma_1.default.asset.update({
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
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'UPDATE',
                entityType: 'Asset',
                entityId: id,
            },
        });
        return res.status(200).json(asset);
    }
    catch (error) {
        console.error('Update asset error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateAsset = updateAsset;
const retireAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const asset = await prisma_1.default.asset.update({
            where: { id },
            data: { status: 'RETIRED' },
        });
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'RETIRE',
                entityType: 'Asset',
                entityId: id,
            },
        });
        return res.status(200).json(asset);
    }
    catch (error) {
        console.error('Retire asset error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.retireAsset = retireAsset;
//# sourceMappingURL=assetController.js.map