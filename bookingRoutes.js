"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bookingController_1 = require("../controllers/bookingController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', bookingController_1.createBooking);
router.get('/', bookingController_1.getBookings);
router.get('/calendar', bookingController_1.getBookingsForCalendar);
router.put('/:id', bookingController_1.updateBooking);
router.delete('/:id', bookingController_1.cancelBooking);
exports.default = router;
//# sourceMappingURL=bookingRoutes.js.map