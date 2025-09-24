const express = require('express');
const router = express.Router();
const { Genre, Movie } = require('../models');

// GET /genres → list all genres
router.get('/', async (req, res) => {
  try {
    const genres = await Genre.findAll();
    res.json(genres);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /genres/:id/movies → get movies for a genre
router.get('/:id/movies', async (req, res) => {
  try {
    const genre = await Genre.findByPk(req.params.id, {
      include: Movie,
    });
    if (!genre) return res.status(404).json({ error: 'Genre not found' });
    res.json(genre.Movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
