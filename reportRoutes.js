"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController_1 = require("../controllers/reportController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/asset-utilization', (0, auth_1.authorize)('ADMIN', 'ASSET_MANAGER'), reportController_1.getAssetUtilization);
router.get('/booking-heatmap', (0, auth_1.authorize)('ADMIN', 'ASSET_MANAGER'), reportController_1.getBookingHeatmap);
router.get('/export/csv', (0, auth_1.authorize)('ADMIN', 'ASSET_MANAGER'), reportController_1.exportAssetReportCSV);
exports.default = router;
//# sourceMappingURL=reportRoutes.js.map