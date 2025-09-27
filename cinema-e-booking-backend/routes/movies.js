const express = require('express');
const router = express.Router();
const { Movie, Genre, Show } = require('../models');

router.get('/', async (req, res) => {
  try {
    const movies = await Movie.findAll({
      include: [Genre, Show],
    });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findByPk(req.params.id, {
      include: [Genre, Show],
    });
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
