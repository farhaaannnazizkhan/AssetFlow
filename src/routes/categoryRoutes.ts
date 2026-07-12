import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'ASSET_MANAGER'), getCategories);
router.post('/', authorize('ADMIN'), createCategory);
router.put('/:id', authorize('ADMIN'), updateCategory);
router.delete('/:id', authorize('ADMIN'), deleteCategory);

export default router;
