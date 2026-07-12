"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const allocationController_1 = require("../controllers/allocationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', (0, auth_1.authorize)('ADMIN', 'ASSET_MANAGER'), allocationController_1.createAllocation);
router.put('/:id/return', allocationController_1.returnAsset);
router.get('/active', allocationController_1.getActiveAllocations);
router.get('/', (0, auth_1.authorize)('ADMIN', 'ASSET_MANAGER'), allocationController_1.getAllAllocations);
exports.default = router;
//# sourceMappingURL=allocationRoutes.js.map