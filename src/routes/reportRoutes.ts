import { Router } from 'express';
import { getAssetUtilization, getBookingHeatmap, exportAssetReportCSV } from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/asset-utilization', authorize('ADMIN', 'ASSET_MANAGER'), getAssetUtilization);
router.get('/booking-heatmap', authorize('ADMIN', 'ASSET_MANAGER'), getBookingHeatmap);
router.get('/export/csv', authorize('ADMIN', 'ASSET_MANAGER'), exportAssetReportCSV);

export default router;
