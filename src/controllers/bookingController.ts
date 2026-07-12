import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const hasOverlap = (existingStart: Date, existingEnd: Date, newStart: Date, newEnd: Date): boolean => {
  return existingStart < newEnd && existingEnd > newStart;
};

export const createBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assetId, startTime, endTime, purpose } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }

    const overlappingBookings = await prisma.booking.findMany({
      where: {
        assetId,
        status: 'CONFIRMED',
        OR: [
          { startTime: { lt: end }, endTime: { gt: start } },
        ],
      },
    });

    if (overlappingBookings.length > 0) {
      return res.status(409).json({
        message: 'Booking overlaps with existing booking',
        conflictingBookings: overlappingBookings,
      });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const booking = await prisma.booking.create({
      data: {
        assetId,
        userId: req.user!.id,
        startTime: start,
        endTime: end,
        purpose: purpose || null,
      },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        type: 'ALLOCATION',
        message: `Resource ${asset.name} booked from ${start.toLocaleString()} to ${end.toLocaleString()}.`,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE_BOOKING',
        entityType: 'Booking',
        entityId: booking.id,
      },
    });

    return res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assetId, userId, startDate, endDate } = req.query;

    const where: any = {};

    if (assetId) where.assetId = assetId as string;
    if (userId) where.userId = userId as string;
    if (startDate && endDate) {
      where.startTime = { gte: new Date(startDate as string) };
      where.endTime = { lte: new Date(endDate as string) };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { startTime, endTime, purpose } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({ message: 'Booking cannot be modified' });
    }

    const newStart = startTime ? new Date(startTime) : booking.startTime;
    const newEnd = endTime ? new Date(endTime) : booking.endTime;

    if (newStart >= newEnd) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }

    const overlappingBookings = await prisma.booking.findMany({
      where: {
        assetId: booking.assetId,
        status: 'CONFIRMED',
        id: { not: id },
        OR: [
          { startTime: { lt: newEnd }, endTime: { gt: newStart } },
        ],
      },
    });

    if (overlappingBookings.length > 0) {
      return res.status(409).json({
        message: 'Booking overlaps with existing booking',
        conflictingBookings: overlappingBookings,
      });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        startTime: newStart,
        endTime: newEnd,
        purpose: purpose !== undefined ? purpose : booking.purpose,
      },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_BOOKING',
        entityType: 'Booking',
        entityId: id,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update booking error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const cancelBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'CANCEL_BOOKING',
        entityType: 'Booking',
        entityId: id,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getBookingsForCalendar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assetId, start, end } = req.query;

    const where: any = { status: 'CONFIRMED' };
    if (assetId) where.assetId = assetId as string;
    if (start && end) {
      where.startTime = { gte: new Date(start as string) };
      where.endTime = { lte: new Date(end as string) };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Get calendar bookings error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
