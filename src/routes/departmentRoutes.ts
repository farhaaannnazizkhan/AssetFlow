import { Router } from 'express';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'ASSET_MANAGER'), getDepartments);
router.post('/', authorize('ADMIN'), createDepartment);
router.put('/:id', authorize('ADMIN'), updateDepartment);
router.delete('/:id', authorize('ADMIN'), deleteDepartment);

export default router;
