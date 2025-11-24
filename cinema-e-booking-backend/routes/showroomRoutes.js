const express = require('express');
const router = express.Router();
const db = require('../models');

router.get('/', async (req, res) => {
  try {
    const showrooms = await db.Showroom.findAll();
    res.json({ showrooms });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch showrooms.' });
  }
});

module.exports = router;