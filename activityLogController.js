"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityLogs = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getActivityLogs = async (req, res) => {
    try {
        const { userId, entityType, action, limit = 100 } = req.query;
        const where = {};
        if (userId)
            where.userId = userId;
        if (entityType)
            where.entityType = entityType;
        if (action)
            where.action = action;
        const logs = await prisma_1.default.activityLog.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
        });
        return res.status(200).json(logs);
    }
    catch (error) {
        console.error('Get activity logs error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getActivityLogs = getActivityLogs;
//# sourceMappingURL=activityLogController.js.map