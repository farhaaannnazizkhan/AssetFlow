import { Router } from 'express';
import {
  createAuditCycle,
  getAuditCycles,
  getAuditCycleById,
  assignAuditors,
  updateAuditItem,
  getAuditDiscrepancies,
  closeAuditCycle,
  getMyAudits,
} from '../controllers/auditController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN'), createAuditCycle);
router.get('/', authorize('ADMIN', 'AUDITOR'), getAuditCycles);
router.get('/my', authorize('AUDITOR'), getMyAudits);
router.get('/:id', authorize('ADMIN', 'AUDITOR'), getAuditCycleById);
router.post('/:id/assign', authorize('ADMIN'), assignAuditors);
router.put('/items/:id', updateAuditItem);
router.get('/:id/discrepancy', authorize('ADMIN'), getAuditDiscrepancies);
router.put('/:id/close', authorize('ADMIN'), closeAuditCycle);

export default router;
