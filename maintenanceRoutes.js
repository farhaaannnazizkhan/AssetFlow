"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const maintenanceController_1 = require("../controllers/maintenanceController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', maintenanceController_1.uploadMiddleware, maintenanceController_1.createMaintenanceRequest);
router.get('/', maintenanceController_1.getMaintenanceRequests);
router.put('/:id/approve', (0, auth_1.authorize)('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), maintenanceController_1.approveMaintenance);
router.put('/:id/reject', (0, auth_1.authorize)('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), maintenanceController_1.rejectMaintenance);
router.put('/:id/resolve', (0, auth_1.authorize)('ADMIN', 'ASSET_MANAGER'), maintenanceController_1.resolveMaintenance);
exports.default = router;
//# sourceMappingURL=maintenanceRoutes.js.map