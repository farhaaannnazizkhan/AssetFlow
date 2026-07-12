"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllNotificationsRead = exports.markNotificationRead = exports.getNotifications = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getNotifications = async (req, res) => {
    try {
        const { unreadOnly } = req.query;
        const where = { userId: req.user.id };
        if (unreadOnly === 'true')
            where.read = false;
        const notifications = await prisma_1.default.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        const unreadCount = await prisma_1.default.notification.count({
            where: { userId: req.user.id, read: false },
        });
        return res.status(200).json({ notifications, unreadCount });
    }
    catch (error) {
        console.error('Get notifications error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getNotifications = getNotifications;
const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await prisma_1.default.notification.update({
            where: { id },
            data: { read: true },
        });
        return res.status(200).json(notification);
    }
    catch (error) {
        console.error('Mark notification read error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.markNotificationRead = markNotificationRead;
const markAllNotificationsRead = async (req, res) => {
    try {
        await prisma_1.default.notification.updateMany({
            where: { userId: req.user.id, read: false },
            data: { read: true },
        });
        return res.status(200).json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Mark all notifications read error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.markAllNotificationsRead = markAllNotificationsRead;
//# sourceMappingURL=notificationController.js.map