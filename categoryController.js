"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getCategories = async (req, res) => {
    try {
        const categories = await prisma_1.default.assetCategory.findMany({
            where: { status: 'ACTIVE' },
            include: {
                _count: {
                    select: { assets: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        return res.status(200).json(categories);
    }
    catch (error) {
        console.error('Get categories error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getCategories = getCategories;
const createCategory = async (req, res) => {
    try {
        const { name, customFields } = req.body;
        const existing = await prisma_1.default.assetCategory.findFirst({
            where: { name, status: 'ACTIVE' },
        });
        if (existing) {
            return res.status(400).json({ message: 'Category already exists' });
        }
        const category = await prisma_1.default.assetCategory.create({
            data: {
                name,
                customFields: customFields || null,
            },
        });
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'CREATE',
                entityType: 'AssetCategory',
                entityId: category.id,
            },
        });
        return res.status(201).json(category);
    }
    catch (error) {
        console.error('Create category error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, customFields } = req.body;
        const category = await prisma_1.default.assetCategory.update({
            where: { id },
            data: {
                name: name || undefined,
                customFields: customFields !== undefined ? customFields : undefined,
            },
        });
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'UPDATE',
                entityType: 'AssetCategory',
                entityId: id,
            },
        });
        return res.status(200).json(category);
    }
    catch (error) {
        console.error('Update category error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.assetCategory.update({
            where: { id },
            data: { status: 'INACTIVE' },
        });
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'DELETE',
                entityType: 'AssetCategory',
                entityId: id,
            },
        });
        return res.status(200).json({ message: 'Category deactivated successfully' });
    }
    catch (error) {
        console.error('Delete category error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=categoryController.js.map