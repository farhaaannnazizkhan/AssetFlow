"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditController_1 = require("../controllers/auditController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', (0, auth_1.authorize)('ADMIN'), auditController_1.createAuditCycle);
router.get('/', (0, auth_1.authorize)('ADMIN', 'AUDITOR'), auditController_1.getAuditCycles);
router.get('/my', (0, auth_1.authorize)('AUDITOR'), auditController_1.getMyAudits);
router.get('/:id', (0, auth_1.authorize)('ADMIN', 'AUDITOR'), auditController_1.getAuditCycleById);
router.post('/:id/assign', (0, auth_1.authorize)('ADMIN'), auditController_1.assignAuditors);
router.put('/items/:id', auditController_1.updateAuditItem);
router.get('/:id/discrepancy', (0, auth_1.authorize)('ADMIN'), auditController_1.getAuditDiscrepancies);
router.put('/:id/close', (0, auth_1.authorize)('ADMIN'), auditController_1.closeAuditCycle);
exports.default = router;
//# sourceMappingURL=auditRoutes.js.map