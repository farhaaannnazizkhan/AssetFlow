import { Router } from 'express';
import { createMaintenanceRequest, approveMaintenance, rejectMaintenance, resolveMaintenance, getMaintenanceRequests, uploadMiddleware } from '../controllers/maintenanceController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', uploadMiddleware, createMaintenanceRequest);
router.get('/', getMaintenanceRequests);
router.put('/:id/approve', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), approveMaintenance);
router.put('/:id/reject', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), rejectMaintenance);
router.put('/:id/resolve', authorize('ADMIN', 'ASSET_MANAGER'), resolveMaintenance);

export default router;
