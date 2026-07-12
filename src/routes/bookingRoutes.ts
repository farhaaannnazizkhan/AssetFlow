import { Router } from 'express';
import { createBooking, getBookings, updateBooking, cancelBooking, getBookingsForCalendar } from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createBooking);
router.get('/', getBookings);
router.get('/calendar', getBookingsForCalendar);
router.put('/:id', updateBooking);
router.delete('/:id', cancelBooking);

export default router;
