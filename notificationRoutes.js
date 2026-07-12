"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', notificationController_1.getNotifications);
router.put('/:id/read', notificationController_1.markNotificationRead);
router.put('/read-all', notificationController_1.markAllNotificationsRead);
exports.default = router;
//# sourceMappingURL=notificationRoutes.js.map