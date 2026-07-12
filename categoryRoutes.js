"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = require("../controllers/categoryController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.authorize)('ADMIN', 'ASSET_MANAGER'), categoryController_1.getCategories);
router.post('/', (0, auth_1.authorize)('ADMIN'), categoryController_1.createCategory);
router.put('/:id', (0, auth_1.authorize)('ADMIN'), categoryController_1.updateCategory);
router.delete('/:id', (0, auth_1.authorize)('ADMIN'), categoryController_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=categoryRoutes.js.map