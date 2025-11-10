
const express = require('express');
const router = express.Router();
const { fetchAvailableSeats, reserveSeats } = require('../controllers/bookingController');

router.get('/seats/:show_id', fetchAvailableSeats);     
router.post('/reserve', reserveSeats);                  

module.exports = router;
