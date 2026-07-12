"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingsForCalendar = exports.cancelBooking = exports.updateBooking = exports.getBookings = exports.createBooking = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const hasOverlap = (existingStart, existingEnd, newStart, newEnd) => {
    return existingStart < newEnd && existingEnd > newStart;
};
const createBooking = async (req, res) => {
    try {
        const { assetId, startTime, endTime, purpose } = req.body;
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (start >= end) {
            return res.status(400).json({ message: 'Start time must be before end time' });
        }
        const overlappingBookings = await prisma_1.default.booking.findMany({
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
        const asset = await prisma_1.default.asset.findUnique({
            where: { id: assetId },
        });
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        const booking = await prisma_1.default.booking.create({
            data: {
                assetId,
                userId: req.user.id,
                startTime: start,
                endTime: end,
                purpose: purpose || null,
            },
            include: {
                asset: { select: { id: true, assetTag: true, name: true } },
                user: { select: { id: true, name: true, email: true } },
            },
        });
        await prisma_1.default.notification.create({
            data: {
                userId: req.user.id,
                type: 'ALLOCATION',
                message: `Resource ${asset.name} booked from ${start.toLocaleString()} to ${end.toLocaleString()}.`,
            },
        });
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'CREATE_BOOKING',
                entityType: 'Booking',
                entityId: booking.id,
            },
        });
        return res.status(201).json(booking);
    }
    catch (error) {
        console.error('Create booking error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createBooking = createBooking;
const getBookings = async (req, res) => {
    try {
        const { assetId, userId, startDate, endDate } = req.query;
        const where = {};
        if (assetId)
            where.assetId = assetId;
        if (userId)
            where.userId = userId;
        if (startDate && endDate) {
            where.startTime = { gte: new Date(startDate) };
            where.endTime = { lte: new Date(endDate) };
        }
        const bookings = await prisma_1.default.booking.findMany({
            where,
            include: {
                asset: { select: { id: true, assetTag: true, name: true } },
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { startTime: 'asc' },
        });
        return res.status(200).json(bookings);
    }
    catch (error) {
        console.error('Get bookings error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getBookings = getBookings;
const updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { startTime, endTime, purpose } = req.body;
        const booking = await prisma_1.default.booking.findUnique({
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
        const overlappingBookings = await prisma_1.default.booking.findMany({
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
        const updated = await prisma_1.default.booking.update({
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
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'UPDATE_BOOKING',
                entityType: 'Booking',
                entityId: id,
            },
        });
        return res.status(200).json(updated);
    }
    catch (error) {
        console.error('Update booking error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateBooking = updateBooking;
const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await prisma_1.default.booking.findUnique({
            where: { id },
        });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        const updated = await prisma_1.default.booking.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
        await prisma_1.default.activityLog.create({
            data: {
                userId: req.user.id,
                action: 'CANCEL_BOOKING',
                entityType: 'Booking',
                entityId: id,
            },
        });
        return res.status(200).json(updated);
    }
    catch (error) {
        console.error('Cancel booking error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.cancelBooking = cancelBooking;
const getBookingsForCalendar = async (req, res) => {
    try {
        const { assetId, start, end } = req.query;
        const where = { status: 'CONFIRMED' };
        if (assetId)
            where.assetId = assetId;
        if (start && end) {
            where.startTime = { gte: new Date(start) };
            where.endTime = { lte: new Date(end) };
        }
        const bookings = await prisma_1.default.booking.findMany({
            where,
            include: {
                asset: { select: { id: true, assetTag: true, name: true } },
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { startTime: 'asc' },
        });
        return res.status(200).json(bookings);
    }
    catch (error) {
        console.error('Get calendar bookings error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getBookingsForCalendar = getBookingsForCalendar;
//# sourceMappingURL=bookingController.js.map