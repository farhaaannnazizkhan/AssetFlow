"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activityLogController_1 = require("../controllers/activityLogController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.authorize)('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), activityLogController_1.getActivityLogs);
exports.default = router;
//# sourceMappingURL=activityLogRoutes.js.map