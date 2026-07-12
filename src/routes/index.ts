import { Router } from 'express';
import authRoutes from './authRoutes';
import departmentRoutes from './departmentRoutes';
import categoryRoutes from './categoryRoutes';
import employeeRoutes from './employeeRoutes';
import assetRoutes from './assetRoutes';
import allocationRoutes from './allocationRoutes';
import transferRoutes from './transferRoutes';
import bookingRoutes from './bookingRoutes';
import maintenanceRoutes from './maintenanceRoutes';
import auditRoutes from './auditRoutes';
import reportRoutes from './reportRoutes';
import notificationRoutes from './notificationRoutes';
import activityLogRoutes from './activityLogRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/categories', categoryRoutes);
router.use('/employees', employeeRoutes);
router.use('/assets', assetRoutes);
router.use('/allocations', allocationRoutes);
router.use('/transfers', transferRoutes);
router.use('/bookings', bookingRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/audits', auditRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activity-logs', activityLogRoutes);

export default router;
