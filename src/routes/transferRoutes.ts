import { Router } from 'express';
import { createTransferRequest, approveTransfer, rejectTransfer, getTransfers } from '../controllers/transferController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createTransferRequest);
router.put('/:id/approve', approveTransfer);
router.put('/:id/reject', rejectTransfer);
router.get('/', getTransfers);

export default router;
