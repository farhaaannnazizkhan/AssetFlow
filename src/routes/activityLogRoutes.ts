import { Router } from 'express';
import { getActivityLogs } from '../controllers/activityLogController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), getActivityLogs);

export default router;
