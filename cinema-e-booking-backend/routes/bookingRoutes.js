const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authenMiddleware');
const {
  fetchAvailableSeats,
  reserveSeats,
  getOrderHistory,
  getBookingDetails
} = require('../controllers/bookingController');

// get seat map for a show
router.get('/seats/:show_id', fetchAvailableSeats);

// checkout + payment, creates booking and sends confirmation email
router.post('/reserve', reserveSeats);

//order history for the logged-in user
router.get('/history', authMiddleware, getOrderHistory);

// details for a single booking 
router.get('/details/:booking_id', authMiddleware, getBookingDetails);

module.exports = router;
