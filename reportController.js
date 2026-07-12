"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAssetReportCSV = exports.getBookingHeatmap = exports.getAssetUtilization = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getAssetUtilization = async (req, res) => {
    try {
        const totalAssets = await prisma_1.default.asset.count();
        const allocated = await prisma_1.default.asset.count({ where: { status: 'ALLOCATED' } });
        const available = await prisma_1.default.asset.count({ where: { status: 'AVAILABLE' } });
        const underMaintenance = await prisma_1.default.asset.count({ where: { status: 'UNDER_MAINTENANCE' } });
        const reserved = await prisma_1.default.asset.count({ where: { status: 'RESERVED' } });
        const lost = await prisma_1.default.asset.count({ where: { status: 'LOST' } });
        const retired = await prisma_1.default.asset.count({ where: { status: 'RETIRED' } });
        const utilization = await prisma_1.default.asset.groupBy({
            by: ['departmentId'],
            _count: { id: true },
            where: { status: { in: ['ALLOCATED', 'RESERVED'] } },
        });
        const departmentNames = {};
        const departments = await prisma_1.default.department.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, name: true },
        });
        departments.forEach(d => {
            departmentNames[d.id] = d.name;
        });
        const utilizationWithNames = utilization.map(item => ({
            department: departmentNames[item.departmentId ?? ''] || 'Unassigned',
            count: item._count.id,
        }));
        return res.status(200).json({
            total: totalAssets,
            allocated,
            available,
            underMaintenance,
            reserved,
            lost,
            retired,
            utilizationByDepartment: utilizationWithNames,
        });
    }
    catch (error) {
        console.error('Get asset utilization error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAssetUtilization = getAssetUtilization;
const getBookingHeatmap = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = { status: 'CONFIRMED' };
        if (startDate && endDate) {
            where.startTime = { gte: new Date(startDate), lte: new Date(endDate) };
        }
        const bookings = await prisma_1.default.booking.findMany({
            where,
            select: { startTime: true, endTime: true },
        });
        const heatmap = {};
        bookings.forEach(booking => {
            const start = new Date(booking.startTime);
            const end = new Date(booking.endTime);
            const day = start.toISOString().split('T')[0];
            const hour = start.getHours();
            if (!heatmap[day])
                heatmap[day] = {};
            if (!heatmap[day][hour])
                heatmap[day][hour] = 0;
            heatmap[day][hour]++;
        });
        return res.status(200).json(heatmap);
    }
    catch (error) {
        console.error('Get booking heatmap error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getBookingHeatmap = getBookingHeatmap;
const exportAssetReportCSV = async (req, res) => {
    try {
        const assets = await prisma_1.default.asset.findMany({
            include: {
                category: { select: { name: true } },
                department: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const headers = ['Asset Tag', 'Name', 'Category', 'Department', 'Status', 'Location', 'Serial Number', 'Purchase Date', 'Purchase Cost'];
        const rows = assets.map(asset => [
            asset.assetTag,
            asset.name,
            asset.category?.name || '',
            asset.department?.name || '',
            asset.status,
            asset.location || '',
            asset.serialNumber || '',
            asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
            asset.purchaseCost || '',
        ]);
        const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=asset-report.csv');
        return res.status(200).send(csv);
    }
    catch (error) {
        console.error('Export CSV error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.exportAssetReportCSV = exportAssetReportCSV;
//# sourceMappingURL=reportController.js.map