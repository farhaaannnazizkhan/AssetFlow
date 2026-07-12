"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMaintenanceRequests = exports.resolveMaintenance = exports.rejectMaintenance = exports.approveMaintenance = exports.createMaintenanceRequest = exports.uploadMiddleware = void 0;
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
        cb(null, 'maintenance-' + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
exports.uploadMiddleware = (0, multer_1.default)({
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
const createMaintenanceRequest = async (req, res) => {
    try {
        const { assetId, description, priority } = req.body;
        const asset = await prisma_1.default.asset.findUnique({
            where: { id: assetId },
        });
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        const photo = req.file ? `/uploads/${req.file.filename}` : null;
        const maintenance = await prisma_1.default.maintenanceRequest.create({
            data: {
                assetId,
                requestedBy: req.user.id,
                description,
                priority: priority || 'MEDIUM',
                photo,
            },
            include: {
                asset: { select: { id: true, assetTag: true, name: true } },
                user: { select: { id: true, name: true, email: true } },
            },
        });
        const managers = await prisma_1.default.user.findMany({
            where: { role: { in: ['ADMIN', 'ASSET_MANAGER'] }, status: 'ACTIVE' },
            select: { id: true },
        });
        for (const manager of managers) {
            await prisma_1.default.notification.create({
                data: {
                    userId: manager.id,
                    type: 'MAINTENANCE_REQUEST',
                    message: `New maintenance request for asset ${asset.assetTag} (${asset.name}).`,
                },
            });
        }
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'CREATE_MAINTENANCE',
                entityType: 'MaintenanceRequest',
                entityId: maintenance.id,
            },
        });
        return res.status(201).json(maintenance);
    }
    catch (error) {
        console.error('Create maintenance error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createMaintenanceRequest = createMaintenanceRequest;
const approveMaintenance = async (req, res) => {
    try {
        const { id } = req.params;
        const maintenance = await prisma_1.default.maintenanceRequest.findUnique({
            where: { id },
            include: { asset: true },
        });
        if (!maintenance) {
            return res.status(404).json({ message: 'Maintenance request not found' });
        }
        if (maintenance.status !== 'REQUESTED') {
            return res.status(400).json({ message: 'Maintenance request is not in REQUESTED status' });
        }
        const updated = await prisma_1.default.maintenanceRequest.update({
            where: { id },
            data: {
                status: 'APPROVED',
                approvedBy: req.user.id,
            },
        });
        await prisma_1.default.asset.update({
            where: { id: maintenance.assetId },
            data: { status: 'UNDER_MAINTENANCE' },
        });
        await prisma_1.default.notification.create({
            data: {
                userId: maintenance.requestedBy,
                type: 'MAINTENANCE_APPROVED',
                message: `Maintenance request for ${maintenance.asset.name} has been approved.`,
            },
        });
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'APPROVE_MAINTENANCE',
                entityType: 'MaintenanceRequest',
                entityId: id,
            },
        });
        return res.status(200).json(updated);
    }
    catch (error) {
        console.error('Approve maintenance error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.approveMaintenance = approveMaintenance;
const rejectMaintenance = async (req, res) => {
    try {
        const { id } = req.params;
        const maintenance = await prisma_1.default.maintenanceRequest.findUnique({
            where: { id },
        });
        if (!maintenance) {
            return res.status(404).json({ message: 'Maintenance request not found' });
        }
        const updated = await prisma_1.default.maintenanceRequest.update({
            where: { id },
            data: { status: 'REJECTED' },
        });
        await prisma_1.default.notification.create({
            data: {
                userId: maintenance.requestedBy,
                type: 'MAINTENANCE_APPROVED',
                message: `Maintenance request for asset has been rejected.`,
            },
        });
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'REJECT_MAINTENANCE',
                entityType: 'MaintenanceRequest',
                entityId: id,
            },
        });
        return res.status(200).json(updated);
    }
    catch (error) {
        console.error('Reject maintenance error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.rejectMaintenance = rejectMaintenance;
const resolveMaintenance = async (req, res) => {
    try {
        const { id } = req.params;
        const maintenance = await prisma_1.default.maintenanceRequest.findUnique({
            where: { id },
            include: { asset: true },
        });
        if (!maintenance) {
            return res.status(404).json({ message: 'Maintenance request not found' });
        }
        const updated = await prisma_1.default.maintenanceRequest.update({
            where: { id },
            data: {
                status: 'RESOLVED',
                resolvedAt: new Date(),
            },
        });
        await prisma_1.default.asset.update({
            where: { id: maintenance.assetId },
            data: { status: 'AVAILABLE' },
        });
        await prisma_1.default.notification.create({
            data: {
                userId: maintenance.requestedBy,
                type: 'MAINTENANCE_RESOLVED',
                message: `Maintenance for ${maintenance.asset.name} has been resolved.`,
            },
        });
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'RESOLVE_MAINTENANCE',
                entityType: 'MaintenanceRequest',
                entityId: id,
            },
        });
        return res.status(200).json(updated);
    }
    catch (error) {
        console.error('Resolve maintenance error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.resolveMaintenance = resolveMaintenance;
const getMaintenanceRequests = async (req, res) => {
    try {
        const { status, assetId } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (assetId)
            where.assetId = assetId;
        const requests = await prisma_1.default.maintenanceRequest.findMany({
            where,
            include: {
                asset: { select: { id: true, assetTag: true, name: true, status: true } },
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json(requests);
    }
    catch (error) {
        console.error('Get maintenance requests error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getMaintenanceRequests = getMaintenanceRequests;
//# sourceMappingURL=maintenanceController.js.map