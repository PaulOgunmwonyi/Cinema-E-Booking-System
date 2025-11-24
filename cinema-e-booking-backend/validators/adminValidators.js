const { body } = require('express-validator');

const addMovieValidator = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title required'),
  body('synopsis').trim().isLength({ min: 10 }).withMessage('Synopsis required'),
  body('director').trim().isLength({ min: 1 }).withMessage('Director required'),
  body('producer').trim().isLength({ min: 1 }).withMessage('Producer required'),
  body('cast').isArray().withMessage('Cast must be an array').custom((v) => Array.isArray(v) && v.length > 0).withMessage('Cast cannot be empty'),
  body('language').optional({ nullable: true }).trim().isLength({ max: 50 }),
  body('rating').trim().isLength({ min: 1 }).withMessage('MPAA rating required'), 
  body('duration_minutes').isInt({ min: 30, max: 400 }).withMessage('Duration (minutes) required'),
  body('release_date').optional({ nullable: true }).isISO8601().toDate(),
  body('poster_url').trim().isURL().withMessage('Poster must be a valid URL'),
  body('trailer_url').trim().isURL().withMessage('Trailer must be a valid URL'),
  body('genres').isArray().withMessage('Genres must be an array of genre names').custom((v) => Array.isArray(v) && v.length > 0).withMessage('Genres cannot be empty'),
  body('reviews').trim().isLength({ min: 1 }).withMessage('Reviews required')
];

const scheduleShowtimeValidator = [
  body('movie_id').isUUID().withMessage('movie_id must be UUID'),
  body('showroom_id').isUUID().withMessage('showroom_id must be UUID'),
  body('start_time').isISO8601().withMessage('start_time must be ISO date'),
  body('end_time').isISO8601().withMessage('end_time must be ISO date')
    .custom((value, { req }) => {
      const start = new Date(req.body.start_time);
      const end = new Date(value);
      if (end <= start) throw new Error('end_time must be after start_time');
      return true;
    })
];

const promotionValidator = [
  body('code')
    .trim()
    .isLength({ min: 3, max: 24 }).withMessage('Code 3–24 chars')
    .matches(/^[A-Z0-9_-]+$/).withMessage('Code must be UPPERCASE letters, numbers, _ or -')
    .customSanitizer((v)=> v.toUpperCase()),
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title required'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 1000 }),
  body('start_date').isISO8601().toDate(),
  body('end_date').isISO8601().toDate()
    .custom((end, { req }) => {
      if (new Date(end) <= new Date(req.body.start_date)) {
        throw new Error('end_date must be after start_date');
      }
      return true;
    }),
  body('discount_percent').isFloat({ gt: 0, lte: 100 }).withMessage('Discount 1–100')
];

module.exports = { addMovieValidator, scheduleShowtimeValidator, promotionValidator };
