import { Router } from 'express';
import { createAllocation, returnAsset, getActiveAllocations, getAllAllocations } from '../controllers/allocationController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN', 'ASSET_MANAGER'), createAllocation);
router.put('/:id/return', returnAsset);
router.get('/active', getActiveAllocations);
router.get('/', authorize('ADMIN', 'ASSET_MANAGER'), getAllAllocations);

export default router;
