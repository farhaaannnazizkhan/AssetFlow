"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEmployeeStatus = exports.updateEmployeeRole = exports.getEmployees = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getEmployees = async (req, res) => {
    try {
        const { departmentId, status } = req.query;
        const where = {
            role: { not: 'ADMIN' },
        };
        if (departmentId)
            where.departmentId = departmentId;
        if (status)
            where.status = status;
        const users = await prisma_1.default.user.findMany({
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
    }
    catch (error) {
        console.error('Get employees error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getEmployees = getEmployees;
const updateEmployeeRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['DEPARTMENT_HEAD', 'ASSET_MANAGER', 'AUDITOR', 'EMPLOYEE'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        const user = await prisma_1.default.user.update({
            where: { id },
            data: { role: role },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                departmentId: true,
            },
        });
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'UPDATE_ROLE',
                entityType: 'User',
                entityId: id,
                details: { newRole: role },
            },
        });
        await prisma_1.default.notification.create({
            data: {
                userId: id,
                type: 'SYSTEM',
                message: `Your role has been updated to ${role}`,
            },
        });
        return res.status(200).json(user);
    }
    catch (error) {
        console.error('Update employee role error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateEmployeeRole = updateEmployeeRole;
const updateEmployeeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user = await prisma_1.default.user.update({
            where: { id },
            data: { status: status },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
            },
        });
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'UPDATE_STATUS',
                entityType: 'User',
                entityId: id,
                details: { newStatus: status },
            },
        });
        return res.status(200).json(user);
    }
    catch (error) {
        console.error('Update employee status error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateEmployeeStatus = updateEmployeeStatus;
//# sourceMappingURL=employeeController.js.map