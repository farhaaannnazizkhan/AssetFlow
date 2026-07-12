"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employeeController_1 = require("../controllers/employeeController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.authorize)('ADMIN'), employeeController_1.getEmployees);
router.put('/:id/role', (0, auth_1.authorize)('ADMIN'), employeeController_1.updateEmployeeRole);
router.put('/:id/status', (0, auth_1.authorize)('ADMIN'), employeeController_1.updateEmployeeStatus);
exports.default = router;
//# sourceMappingURL=employeeRoutes.js.map