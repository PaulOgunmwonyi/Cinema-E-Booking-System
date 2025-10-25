const express = require('express');
const authMiddleware = require('../middleware/authenMiddleware');
const { getProfile, updateProfile } = require('../controllers/profileController');

const router = express.Router();

router.get('/me', authMiddleware, getProfile);

router.put('/edit', authMiddleware, updateProfile);

module.exports = router;
