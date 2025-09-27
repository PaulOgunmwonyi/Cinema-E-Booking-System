const express = require('express');
const router = express.Router();
const { Show, Movie } = require('../models');

router.get('/', async (req, res) => {
  try {
    const shows = await Show.findAll({ include: Movie });
    res.json(shows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
