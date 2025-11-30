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
  deleteShowtime,
  listUsers, addUser, updateUser, deleteUser,
  updateMovie
} = require('../controllers/admin/adminController');

const { createPromotion, sendPromotion, listPromotions } = require('../controllers/admin/promotionsController');

router.get('/', adminHome);

// Movies
router.post('/movies', addMovieValidator, validate, addMovie);
router.get('/movies', listMovies);
router.put('/movies/:id', updateMovie);

// Showtimes
router.post('/showtimes', scheduleShowtimeValidator, validate, addShowtime);
router.get('/showtimes', listShowtimes);
router.delete('/showtimes/:id', deleteShowtime);

// Promotions
router.post('/promotions', promotionValidator, validate, createPromotion);
router.get('/promotions', listPromotions);
router.post('/promotions/send', sendPromotion);

// User management
router.get('/users', listUsers);
router.post('/users', addUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
