"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const departmentController_1 = require("../controllers/departmentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.authorize)('ADMIN', 'ASSET_MANAGER'), departmentController_1.getDepartments);
router.post('/', (0, auth_1.authorize)('ADMIN'), departmentController_1.createDepartment);
router.put('/:id', (0, auth_1.authorize)('ADMIN'), departmentController_1.updateDepartment);
router.delete('/:id', (0, auth_1.authorize)('ADMIN'), departmentController_1.deleteDepartment);
exports.default = router;
//# sourceMappingURL=departmentRoutes.js.map