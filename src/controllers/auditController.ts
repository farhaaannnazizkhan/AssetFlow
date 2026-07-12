import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export const createAuditCycle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, scope, startDate, endDate } = req.body;

    const cycle = await prisma.auditCycle.create({
      data: {
        name,
        description: description || null,
        scope,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdById: req.user!.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE_AUDIT_CYCLE',
        entityType: 'AuditCycle',
        entityId: cycle.id,
      },
    });

    return res.status(201).json(cycle);
  } catch (error) {
    console.error('Create audit cycle error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAuditCycles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cycles = await prisma.auditCycle.findMany({
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
  } catch (error) {
    console.error('Get audit cycles error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAuditCycleById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const cycle = await prisma.auditCycle.findUnique({
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
  } catch (error) {
    console.error('Get audit cycle by id error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const assignAuditors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { auditorIds } = req.body;

    const cycle = await prisma.auditCycle.findUnique({
      where: { id },
    });

    if (!cycle) {
      return res.status(404).json({ message: 'Audit cycle not found' });
    }

    await prisma.assignedAudit.deleteMany({
      where: { auditCycleId: id },
    });

    const assignments = [];
    for (const auditorId of auditorIds) {
      const assignment = await prisma.assignedAudit.create({
        data: {
          auditCycleId: id,
          auditorId,
        },
      });
      assignments.push(assignment);

      await prisma.notification.create({
        data: {
          userId: auditorId,
          type: 'AUDIT_ASSIGNED',
          message: `You have been assigned to audit cycle: ${cycle.name}.`,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'ASSIGN_AUDITORS',
        entityType: 'AuditCycle',
        entityId: id,
        details: { auditorIds },
      },
    });

    return res.status(200).json({ assignments });
  } catch (error) {
    console.error('Assign auditors error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAuditItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { result, notes } = req.body;

    const auditItem = await prisma.auditItem.update({
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

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_AUDIT_ITEM',
        entityType: 'AuditItem',
        entityId: id,
        details: { result },
      },
    });

    return res.status(200).json(auditItem);
  } catch (error) {
    console.error('Update audit item error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAuditDiscrepancies = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const discrepancies = await prisma.auditItem.findMany({
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
  } catch (error) {
    console.error('Get audit discrepancies error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const closeAuditCycle = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const cycle = await prisma.auditCycle.findUnique({
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
        await prisma.asset.update({
          where: { id: item.assetId },
          data: { status: 'LOST' },
        });
      } else if (item.result === 'DAMAGED') {
        await prisma.asset.update({
          where: { id: item.assetId },
          data: { status: 'UNDER_MAINTENANCE' },
        });
      }
    }

    const updated = await prisma.auditCycle.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    const assignedAudits = await prisma.assignedAudit.findMany({
      where: { auditCycleId: id },
      select: { auditorId: true },
    });

    for (const assignment of assignedAudits) {
      await prisma.notification.create({
        data: {
          userId: assignment.auditorId,
          type: 'AUDIT_CYCLE_CLOSED',
          message: `Audit cycle "${cycle.name}" has been closed.`,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'CLOSE_AUDIT_CYCLE',
        entityType: 'AuditCycle',
        entityId: id,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Close audit cycle error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyAudits = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assignedAudits = await prisma.assignedAudit.findMany({
      where: { auditorId: req.user!.id },
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
  } catch (error) {
    console.error('Get my audits error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
