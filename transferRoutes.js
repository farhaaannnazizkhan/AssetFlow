"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transferController_1 = require("../controllers/transferController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', transferController_1.createTransferRequest);
router.put('/:id/approve', transferController_1.approveTransfer);
router.put('/:id/reject', transferController_1.rejectTransfer);
router.get('/', transferController_1.getTransfers);
exports.default = router;
//# sourceMappingURL=transferRoutes.js.map