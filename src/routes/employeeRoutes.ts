import { Router } from 'express';
import { getEmployees, updateEmployeeRole, updateEmployeeStatus } from '../controllers/employeeController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN'), getEmployees);
router.put('/:id/role', authorize('ADMIN'), updateEmployeeRole);
router.put('/:id/status', authorize('ADMIN'), updateEmployeeStatus);

export default router;
