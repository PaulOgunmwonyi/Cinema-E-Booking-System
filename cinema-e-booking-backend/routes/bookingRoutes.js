// cinema-e-booking-backend/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const { fetchAvailableSeats, reserveSeats } = require('../controllers/bookingController');

router.get('/seats/:show_id', fetchAvailableSeats);     // view seat map
router.post('/reserve', reserveSeats);                  // reserve seats & mark unavailable

module.exports = router;
