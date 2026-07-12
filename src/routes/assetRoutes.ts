import { Router } from 'express';
import { createAsset, getAssets, getAssetById, updateAsset, retireAsset, uploadMiddleware } from '../controllers/assetController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN', 'ASSET_MANAGER'), uploadMiddleware, createAsset);
router.get('/', authorize('ADMIN', 'ASSET_MANAGER'), getAssets);
router.get('/:id', getAssetById);
router.put('/:id', authorize('ADMIN', 'ASSET_MANAGER'), updateAsset);
router.put('/:id/retire', authorize('ADMIN', 'ASSET_MANAGER'), retireAsset);

export default router;
