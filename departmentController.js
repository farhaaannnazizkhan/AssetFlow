"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDepartment = exports.updateDepartment = exports.createDepartment = exports.getDepartments = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getDepartments = async (req, res) => {
    try {
        const departments = await prisma_1.default.department.findMany({
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
    }
    catch (error) {
        console.error('Get departments error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getDepartments = getDepartments;
const createDepartment = async (req, res) => {
    try {
        const { name, headId, parentId } = req.body;
        const existing = await prisma_1.default.department.findFirst({
            where: { name, status: 'ACTIVE' },
        });
        if (existing) {
            return res.status(400).json({ message: 'Department already exists' });
        }
        const department = await prisma_1.default.department.create({
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
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'CREATE',
                entityType: 'Department',
                entityId: department.id,
            },
        });
        return res.status(201).json(department);
    }
    catch (error) {
        console.error('Create department error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createDepartment = createDepartment;
const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, headId, parentId } = req.body;
        const department = await prisma_1.default.department.update({
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
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'UPDATE',
                entityType: 'Department',
                entityId: id,
            },
        });
        return res.status(200).json(department);
    }
    catch (error) {
        console.error('Update department error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateDepartment = updateDepartment;
const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.department.update({
            where: { id },
            data: { status: 'INACTIVE' },
        });
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'DELETE',
                entityType: 'Department',
                entityId: id,
            },
        });
        return res.status(200).json({ message: 'Department deactivated successfully' });
    }
    catch (error) {
        console.error('Delete department error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteDepartment = deleteDepartment;
//# sourceMappingURL=departmentController.js.map