"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransfers = exports.rejectTransfer = exports.approveTransfer = exports.createTransferRequest = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const createTransferRequest = async (req, res) => {
    try {
        const { allocationId, targetHolderId, reason } = req.body;
        const allocation = await prisma_1.default.allocation.findUnique({
            where: { id: allocationId },
            include: { asset: true },
        });
        if (!allocation) {
            return res.status(404).json({ message: 'Allocation not found' });
        }
        if (allocation.userId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'ASSET_MANAGER') {
            return res.status(403).json({ message: 'Not authorized to request this transfer' });
        }
        const existingTransfer = await prisma_1.default.transferRequest.findFirst({
            where: {
                allocationId,
                status: 'PENDING',
            },
        });
        if (existingTransfer) {
            return res.status(400).json({ message: 'A pending transfer already exists for this allocation' });
        }
        const transfer = await prisma_1.default.transferRequest.create({
            data: {
                allocationId,
                fromId: allocation.userId,
                toId: targetHolderId,
                reason: reason || null,
            },
            include: {
                from: { select: { id: true, name: true, email: true } },
                to: { select: { id: true, name: true, email: true } },
                allocation: { include: { asset: true } },
            },
        });
        await prisma_1.default.notification.create({
            data: {
                userId: targetHolderId,
                type: 'TRANSFER_REQUEST',
                message: `You have a transfer request for asset ${allocation.asset.assetTag} from ${transfer.from.name}.`,
            },
        });
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'TRANSFER_REQUEST',
                entityType: 'TransferRequest',
                entityId: transfer.id,
            },
        });
        return res.status(201).json(transfer);
    }
    catch (error) {
        console.error('Create transfer error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createTransferRequest = createTransferRequest;
const approveTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const transfer = await prisma_1.default.transferRequest.findUnique({
            where: { id },
            include: { allocation: { include: { asset: true } } },
        });
        if (!transfer) {
            return res.status(404).json({ message: 'Transfer request not found' });
        }
        if (transfer.status !== 'PENDING') {
            return res.status(400).json({ message: 'Transfer request is not pending' });
        }
        const updatedTransfer = await prisma_1.default.transferRequest.update({
            where: { id },
            data: {
                status: 'APPROVED',
                approvedBy: req.user.id,
                approvedAt: new Date(),
            },
        });
        await prisma_1.default.allocation.update({
            where: { id: transfer.allocationId },
            data: { userId: transfer.toId, status: 'ACTIVE' },
        });
        await prisma_1.default.asset.update({
            where: { id: transfer.allocation.assetId },
            data: { currentHolderId: transfer.toId },
        });
        await prisma_1.default.notification.create({
            data: {
                userId: transfer.fromId,
                type: 'TRANSFER_APPROVED',
                message: `Your transfer request for ${transfer.allocation.asset.assetTag} has been approved.`,
            },
        });
        await prisma_1.default.notification.create({
            data: {
                userId: transfer.toId,
                type: 'TRANSFER_APPROVED',
                message: `Asset ${transfer.allocation.asset.assetTag} has been transferred to you.`,
            },
        });
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'APPROVE_TRANSFER',
                entityType: 'TransferRequest',
                entityId: id,
            },
        });
        return res.status(200).json(updatedTransfer);
    }
    catch (error) {
        console.error('Approve transfer error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.approveTransfer = approveTransfer;
const rejectTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const transfer = await prisma_1.default.transferRequest.findUnique({
            where: { id },
        });
        if (!transfer) {
            return res.status(404).json({ message: 'Transfer request not found' });
        }
        if (transfer.status !== 'PENDING') {
            return res.status(400).json({ message: 'Transfer request is not pending' });
        }
        const updatedTransfer = await prisma_1.default.transferRequest.update({
            where: { id },
            data: {
                status: 'REJECTED',
                rejectedAt: new Date(),
            },
        });
        await prisma_1.default.notification.create({
            data: {
                userId: transfer.fromId,
                type: 'TRANSFER_REJECTED',
                message: `Your transfer request has been rejected.`,
            },
        });
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'REJECT_TRANSFER',
                entityType: 'TransferRequest',
                entityId: id,
            },
        });
        return res.status(200).json(updatedTransfer);
    }
    catch (error) {
        console.error('Reject transfer error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.rejectTransfer = rejectTransfer;
const getTransfers = async (req, res) => {
    try {
        const transfers = await prisma_1.default.transferRequest.findMany({
            include: {
                from: { select: { id: true, name: true, email: true } },
                to: { select: { id: true, name: true, email: true } },
                allocation: { include: { asset: { select: { id: true, assetTag: true, name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json(transfers);
    }
    catch (error) {
        console.error('Get transfers error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getTransfers = getTransfers;
//# sourceMappingURL=transferController.js.map