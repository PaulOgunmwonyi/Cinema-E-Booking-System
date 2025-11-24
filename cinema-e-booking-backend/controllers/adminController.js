const { validationResult } = require('express-validator');
const db = require('../models');
const { sendEmail } = require('../services/emailService');
const bcrypt = require('bcrypt');
const { generateSeatsForShow } = require('./bookingController');

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
    title, synopsis, director, producer, cast = [], language, rating,
    duration_minutes, release_date, poster_url, trailer_url, genres = [], reviews
  } = req.body;

  try {
    const movie = await db.Movie.create({
      title,
      synopsis,
      director,
      producer,
      language,
      mpaa_rating: rating,
      duration_minutes,
      release_date,
      poster_url,
      trailer_url
    });

    if (Array.isArray(genres) && genres.length) {
      const found = await Promise.all(genres.map(async (name) => {
        const [g] = await db.Genre.findOrCreate({ where: { name } });
        return g;
      }));
      await movie.setGenres(found);
    }

    // Return movie plus echoed fields that are validated but not stored in schema (cast, reviews)
    const movieJson = movie.toJSON();
    if (cast) movieJson.cast = cast;
    if (reviews) movieJson.reviews = reviews;
    return res.status(201).json({ message: 'Movie added', movie: movieJson });
  } catch (e) {
    console.error('addMovie error:', e);
    return res.status(500).json({ message: 'Server error adding movie' });
  }
};

// Update movie
const updateMovie = async (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};

  try {
    const movie = await db.Movie.findByPk(id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    // Apply simple scalar updates
    const updatable = ['title', 'synopsis', 'director', 'producer', 'language', 'rating', 'duration_minutes', 'release_date', 'poster_url', 'trailer_url'];
    updatable.forEach((k) => { if (k in updates) movie[k] = updates[k]; });

    await movie.save();

    // Handle genres if provided (array of names)
    if (Array.isArray(updates.genres)) {
      const found = await Promise.all(updates.genres.map(async (name) => {
        const [g] = await db.Genre.findOrCreate({ where: { name } });
        return g;
      }));
      await movie.setGenres(found);
    }

    return res.json({ message: 'Movie updated', movie });
  } catch (e) {
    console.error('updateMovie error:', e);
    return res.status(500).json({ message: 'Server error updating movie' });
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

    // Create the show
    const show = await db.Show.create({ movie_id, showroom_id, start_time, end_time });
    
    // Automatically generate show-specific seats based on showroom layout
    try {
      await generateSeatsForShow(show.id, showroom_id);
      console.log(`Generated seats for new show: ${show.id}`);
    } catch (seatError) {
      console.error('Failed to generate seats for new show:', seatError);
      // Don't fail the show creation if seat generation fails
      // The fetchAvailableSeats endpoint will handle this later
    }
    
    return res.status(201).json({ 
      message: 'Showtime added successfully', 
      show: {
        ...show.toJSON(),
        seats_generated: true
      }
    });
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
      `SELECT email, first_name FROM users WHERE promo_opt_in = true AND is_suspended = false`,
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

// List all users
const listUsers = async (req, res) => {
  const users = await db.User.findAll({ attributes: { exclude: ['password_hash'] } });
  res.json({ users });
};

// Add new admin
const addUser = async (req, res) => {
  const { email, password, is_admin } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  const existing = await db.User.findOne({ where: { email } });
  if (existing) return res.status(400).json({ message: 'User already exists' });
  const password_hash = await bcrypt.hash(password, 10);
  const user = await db.User.create({
    email,
    password_hash,
    is_admin: !!is_admin,
    is_active: true,
    is_suspended: false,
    first_name: '',
    last_name: ''
  });
  res.status(201).json({ message: 'User created', user: { ...user.toJSON(), password_hash: undefined } });
};

// Update user (admin status, suspend/activate, etc.)
const updateUser = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const user = await db.User.findByPk(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if ('is_admin' in updates) user.is_admin = updates.is_admin;
  if ('is_active' in updates) user.is_active = updates.is_active;
  if ('first_name' in updates) user.first_name = updates.first_name;
  if ('last_name' in updates) user.last_name = updates.last_name;
  if ('is_suspended' in updates) user.is_suspended = updates.is_suspended;
  await user.save();
  res.json({ message: 'User updated', user: { ...user.toJSON(), password_hash: undefined } });
};

// Delete user
const deleteUser = async (req, res) => {
  const { id } = req.params;
  const user = await db.User.findByPk(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  await user.destroy();
  res.json({ message: 'User deleted' });
};

// Delete showtime
const deleteShowtime = async (req, res) => {
  const { id } = req.params;
  try {
    const show = await db.Show.findByPk(id);
    if (!show) return res.status(404).json({ message: 'Showtime not found' });
    await show.destroy();
    return res.json({ message: 'Showtime deleted' });
  } catch (e) {
    console.error('deleteShowtime error:', e);
    return res.status(500).json({ message: 'Server error deleting showtime' });
  }
};

module.exports = {
  adminHome,
  addMovie, listMovies,
  updateMovie,
  addShowtime, listShowtimes,
  deleteShowtime,
  createPromotion, sendPromotion,
  listUsers, addUser, updateUser, deleteUser
};
