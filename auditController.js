"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyAudits = exports.closeAuditCycle = exports.getAuditDiscrepancies = exports.updateAuditItem = exports.assignAuditors = exports.getAuditCycleById = exports.getAuditCycles = exports.createAuditCycle = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const createAuditCycle = async (req, res) => {
    try {
        const { name, description, scope, startDate, endDate } = req.body;
        const cycle = await prisma_1.default.auditCycle.create({
            data: {
                name,
                description: description || null,
                scope,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                createdById: req.user.id,
            },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
            },
        });
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'CREATE_AUDIT_CYCLE',
                entityType: 'AuditCycle',
                entityId: cycle.id,
            },
        });
        return res.status(201).json(cycle);
    }
    catch (error) {
        console.error('Create audit cycle error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createAuditCycle = createAuditCycle;
const getAuditCycles = async (req, res) => {
    try {
        const cycles = await prisma_1.default.auditCycle.findMany({
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                assignedAudits: {
                    include: {
                        auditor: { select: { id: true, name: true, email: true } },
                    },
                },
                _count: {
                    select: { auditItems: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json(cycles);
    }
    catch (error) {
        console.error('Get audit cycles error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAuditCycles = getAuditCycles;
const getAuditCycleById = async (req, res) => {
    try {
        const { id } = req.params;
        const cycle = await prisma_1.default.auditCycle.findUnique({
            where: { id },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                assignedAudits: {
                    include: {
                        auditor: { select: { id: true, name: true, email: true } },
                    },
                },
                auditItems: {
                    include: {
                        asset: { select: { id: true, assetTag: true, name: true, status: true } },
                        assignedAudit: {
                            include: { auditor: { select: { id: true, name: true, email: true } } },
                        },
                    },
                },
            },
        });
        if (!cycle) {
            return res.status(404).json({ message: 'Audit cycle not found' });
        }
        return res.status(200).json(cycle);
    }
    catch (error) {
        console.error('Get audit cycle by id error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAuditCycleById = getAuditCycleById;
const assignAuditors = async (req, res) => {
    try {
        const { id } = req.params;
        const { auditorIds } = req.body;
        const cycle = await prisma_1.default.auditCycle.findUnique({
            where: { id },
        });
        if (!cycle) {
            return res.status(404).json({ message: 'Audit cycle not found' });
        }
        await prisma_1.default.assignedAudit.deleteMany({
            where: { auditCycleId: id },
        });
        const assignments = [];
        for (const auditorId of auditorIds) {
            const assignment = await prisma_1.default.assignedAudit.create({
                data: {
                    auditCycleId: id,
                    auditorId,
                },
            });
            assignments.push(assignment);
            await prisma_1.default.notification.create({
                data: {
                    userId: auditorId,
                    type: 'AUDIT_ASSIGNED',
                    message: `You have been assigned to audit cycle: ${cycle.name}.`,
                },
            });
        }
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'ASSIGN_AUDITORS',
                entityType: 'AuditCycle',
                entityId: id,
                details: { auditorIds },
            },
        });
        return res.status(200).json({ assignments });
    }
    catch (error) {
        console.error('Assign auditors error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.assignAuditors = assignAuditors;
const updateAuditItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { result, notes } = req.body;
        const auditItem = await prisma_1.default.auditItem.update({
            where: { id },
            data: {
                result: result || undefined,
                notes: notes !== undefined ? notes : undefined,
                verifiedAt: result ? new Date() : undefined,
            },
            include: {
                asset: { select: { id: true, assetTag: true, name: true, status: true } },
            },
        });
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'UPDATE_AUDIT_ITEM',
                entityType: 'AuditItem',
                entityId: id,
                details: { result },
            },
        });
        return res.status(200).json(auditItem);
    }
    catch (error) {
        console.error('Update audit item error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateAuditItem = updateAuditItem;
const getAuditDiscrepancies = async (req, res) => {
    try {
        const { id } = req.params;
        const discrepancies = await prisma_1.default.auditItem.findMany({
            where: {
                auditCycleId: id,
                result: { not: 'VERIFIED' },
            },
            include: {
                asset: { select: { id: true, assetTag: true, name: true, status: true } },
                assignedAudit: {
                    include: { auditor: { select: { id: true, name: true, email: true } } },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        return res.status(200).json(discrepancies);
    }
    catch (error) {
        console.error('Get audit discrepancies error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAuditDiscrepancies = getAuditDiscrepancies;
const closeAuditCycle = async (req, res) => {
    try {
        const { id } = req.params;
        const cycle = await prisma_1.default.auditCycle.findUnique({
            where: { id },
            include: {
                auditItems: {
                    where: { result: { not: null } },
                    include: { asset: true },
                },
            },
        });
        if (!cycle) {
            return res.status(404).json({ message: 'Audit cycle not found' });
        }
        for (const item of cycle.auditItems) {
            if (item.result === 'MISSING') {
                await prisma_1.default.asset.update({
                    where: { id: item.assetId },
                    data: { status: 'LOST' },
                });
            }
            else if (item.result === 'DAMAGED') {
                await prisma_1.default.asset.update({
                    where: { id: item.assetId },
                    data: { status: 'UNDER_MAINTENANCE' },
                });
            }
        }
        const updated = await prisma_1.default.auditCycle.update({
            where: { id },
            data: { status: 'CLOSED' },
        });
        const assignedAudits = await prisma_1.default.assignedAudit.findMany({
            where: { auditCycleId: id },
            select: { auditorId: true },
        });
        for (const assignment of assignedAudits) {
            await prisma_1.default.notification.create({
                data: {
                    userId: assignment.auditorId,
                    type: 'AUDIT_CYCLE_CLOSED',
                    message: `Audit cycle "${cycle.name}" has been closed.`,
                },
            });
        }
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'CLOSE_AUDIT_CYCLE',
                entityType: 'AuditCycle',
                entityId: id,
            },
        });
        return res.status(200).json(updated);
    }
    catch (error) {
        console.error('Close audit cycle error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.closeAuditCycle = closeAuditCycle;
const getMyAudits = async (req, res) => {
    try {
        const assignedAudits = await prisma_1.default.assignedAudit.findMany({
            where: { auditorId: req.user.id },
            include: {
                auditCycle: true,
                auditItems: {
                    include: {
                        asset: { select: { id: true, assetTag: true, name: true } },
                    },
                },
            },
        });
        return res.status(200).json(assignedAudits);
    }
    catch (error) {
        console.error('Get my audits error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getMyAudits = getMyAudits;
//# sourceMappingURL=auditController.js.map