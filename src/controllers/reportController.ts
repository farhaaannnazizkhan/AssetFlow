import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAssetUtilization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalAssets = await prisma.asset.count();
    const allocated = await prisma.asset.count({ where: { status: 'ALLOCATED' } });
    const available = await prisma.asset.count({ where: { status: 'AVAILABLE' } });
    const underMaintenance = await prisma.asset.count({ where: { status: 'UNDER_MAINTENANCE' } });
    const reserved = await prisma.asset.count({ where: { status: 'RESERVED' } });
    const lost = await prisma.asset.count({ where: { status: 'LOST' } });
    const retired = await prisma.asset.count({ where: { status: 'RETIRED' } });

    const utilization = await prisma.asset.groupBy({
      by: ['departmentId'],
      _count: { id: true },
      where: { status: { in: ['ALLOCATED', 'RESERVED'] } },
    });

    const departmentNames: Record<string, string> = {};
    const departments = await prisma.department.findMany({
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
  } catch (error) {
    console.error('Get asset utilization error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getBookingHeatmap = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = { status: 'CONFIRMED' };
    if (startDate && endDate) {
      where.startTime = { gte: new Date(startDate as string), lte: new Date(endDate as string) };
    }

    const bookings = await prisma.booking.findMany({
      where,
      select: { startTime: true, endTime: true },
    });

    const heatmap: Record<string, Record<string, number>> = {};

    bookings.forEach(booking => {
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);

      const day = start.toISOString().split('T')[0];
      const hour = start.getHours();

      if (!heatmap[day]) heatmap[day] = {};
      if (!heatmap[day][hour]) heatmap[day][hour] = 0;
      heatmap[day][hour]++;
    });

    return res.status(200).json(heatmap);
  } catch (error) {
    console.error('Get booking heatmap error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const exportAssetReportCSV = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assets = await prisma.asset.findMany({
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
  } catch (error) {
    console.error('Export CSV error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
