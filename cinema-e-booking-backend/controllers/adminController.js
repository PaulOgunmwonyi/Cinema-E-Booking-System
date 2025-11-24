const { validationResult } = require('express-validator');
const db = require('../models');
const { sendEmail } = require('../services/emailService');

const adminHome = async (req, res) => {
  return res.json({
    menu: [
      { label: 'Manage Movies', path: '/admin/movies' },
      { label: 'Manage Promotions', path: '/admin/promotions' },
      { label: 'Manage Users', path: '/admin/users' },
      { label: 'Manage Showtimes', path: '/admin/showtimes' }
    ]
  });
};

// Add Movie
const addMovie = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ message: 'Validation failed.', errors: errors.mapped() });

  const {
    title, synopsis, director, cast = [], language, rating,
    duration_minutes, release_date, poster_url, trailer_url, genres = []
  } = req.body;

  try {
    const movie = await db.Movie.create({
      title, synopsis, director, language, rating,
      duration_minutes, release_date, poster_url, trailer_url
    });

    if (Array.isArray(genres) && genres.length) {
      const found = await Promise.all(genres.map(async (name) => {
        const [g] = await db.Genre.findOrCreate({ where: { name } });
        return g;
      }));
      await movie.setGenres(found);
    }

    return res.status(201).json({ message: 'Movie added', movie });
  } catch (e) {
    console.error('addMovie error:', e);
    return res.status(500).json({ message: 'Server error adding movie' });
  }
};

const listMovies = async (req, res) => {
  const movies = await db.Movie.findAll({ include: db.Genre, order: [['created_at','DESC']] }).catch(()=>[]);
  return res.json({ movies });
};

// schedule movie
const addShowtime = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ message: 'Validation failed.', errors: errors.mapped() });

  const { movie_id, showroom_id, start_time, end_time } = req.body;



  try {
    const [movie, showroom] = await Promise.all([
      db.Movie.findByPk(movie_id),
      db.Showroom.findByPk(showroom_id),
    ]);
    if (!movie) return res.status(400).json({ message: 'Movie not found' });
    if (!showroom) return res.status(400).json({ message: 'Showroom not found' });

    const conflict = await db.Show.findOne({ where: { showroom_id, start_time } });
    if (conflict) {
      return res.status(409).json({ message: 'Scheduling conflict: this showroom already has a show at that time.' });
    }

    const show = await db.Show.create({ movie_id, showroom_id, start_time, end_time });
    return res.status(201).json({ message: 'Showtime added', show });
  } catch (e) {
    
    if (String(e).includes('uniq_show_showroom_start')) {
      return res.status(409).json({ message: 'Scheduling conflict: this showroom already has a show at that time.' });
    }
    console.error('addShowtime error:', e);
    return res.status(500).json({ message: 'Server error adding showtime' });
  }
};

//List showtimes 
const listShowtimes = async (req, res) => {
  const shows = await db.Show.findAll({
    include: [
      { model: db.Movie, attributes: ['id', 'title'] },
      { model: db.Showroom, attributes: ['id', 'name'] }
    ],
    order: [['start_time','ASC']]
  }).catch(()=>[]);
  return res.json({ shows });
};

// Create promotion
const createPromotion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ message: 'Validation failed.', errors: errors.mapped() });

  const { code, title, description, start_date, end_date, discount_percent } = req.body;

  try {
    const promo = await db.Promotion.create({ code, title, description, start_date, end_date, discount_percent });
    return res.status(201).json({ message: 'Promotion created', promotion: promo });
  } catch (e) {
    if (String(e).includes('unique') && String(e).includes('code')) {
      return res.status(400).json({ message: 'Promo code already exists' });
    }
    console.error('createPromotion error:', e);
    return res.status(500).json({ message: 'Server error creating promotion' });
  }
};

// Send promotion 
const sendPromotion = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(422).json({ message: 'code is required' });

  try {
    const promo = await db.Promotion.findOne({ where: { code } });
    if (!promo) return res.status(404).json({ message: 'Promotion not found' });

    const subscribers = await db.sequelize.query(
      `SELECT email, first_name FROM users WHERE promo_opt_in = true AND is_active = true`,
      { type: db.Sequelize.QueryTypes.SELECT }
    );

    const html = `
      <h2>${promo.title}</h2>
      <p>${promo.description || ''}</p>
      <p><strong>Use code:</strong> ${promo.code}</p>
      <p>Valid: ${new Date(promo.start_date).toLocaleDateString()} - ${new Date(promo.end_date).toLocaleDateString()}</p>
      <p><strong>Discount:</strong> ${promo.discount_percent}%</p>
    `;

    let sent = 0;
    for (const u of subscribers) {
      await sendEmail({
        to: u.email,
        subject: `Exclusive Offer: ${promo.title}`,
        html
      });
      sent++;
    }

    return res.json({ message: `Promotion sent to ${sent} subscribed users.` });
  } catch (e) {
    console.error('sendPromotion error:', e);
    return res.status(500).json({ message: 'Server error sending promotion' });
  }
};

module.exports = {
  adminHome,
  addMovie, listMovies,
  addShowtime, listShowtimes,
  createPromotion, sendPromotion
};
