"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assetController_1 = require("../controllers/assetController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', (0, auth_1.authorize)('ADMIN', 'ASSET_MANAGER'), assetController_1.uploadMiddleware, assetController_1.createAsset);
router.get('/', (0, auth_1.authorize)('ADMIN', 'ASSET_MANAGER'), assetController_1.getAssets);
router.get('/:id', assetController_1.getAssetById);
router.put('/:id', (0, auth_1.authorize)('ADMIN', 'ASSET_MANAGER'), assetController_1.updateAsset);
router.put('/:id/retire', (0, auth_1.authorize)('ADMIN', 'ASSET_MANAGER'), assetController_1.retireAsset);
exports.default = router;
//# sourceMappingURL=assetRoutes.js.map