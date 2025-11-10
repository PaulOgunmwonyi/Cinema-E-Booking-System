const express = require('express');
const router = express.Router();

const validate = require('../middleware/validate');
const {
  addMovieValidator,
  scheduleShowtimeValidator,
  promotionValidator
} = require('../validators/adminValidators');

const {
  adminHome,
  addMovie, listMovies,
  addShowtime, listShowtimes,
  createPromotion, sendPromotion
} = require('../controllers/adminController');

router.get('/', adminHome);

// Movies
router.post('/movies', addMovieValidator, validate, addMovie);
router.get('/movies', listMovies);

// Showtimes
router.post('/showtimes', scheduleShowtimeValidator, validate, addShowtime);
router.get('/showtimes', listShowtimes);

// Promotions
router.post('/promotions', promotionValidator, validate, createPromotion);
router.post('/promotions/send', sendPromotion);

module.exports = router;
