const express = require('express');
const { registerUser, confirmEmail, loginUser, forgotPassword, resetPassword, logoutUser, confirmCode } = require('../controllers/authController.js');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  registerUser
);
router.post('/verify-code', confirmCode);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);   
router.post('/reset-password', resetPassword); 
router.post('/logout', logoutUser);


module.exports = router;

