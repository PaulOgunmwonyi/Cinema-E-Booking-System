const express = require('express');
const { registerUser, loginUser, forgotPassword, resetPassword, logoutUser, confirmCode } = require('../controllers/authController.js');
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const { registerValidator, loginValidator } = require('../validators/authValidators');

const router = express.Router();

router.post('/register', registerValidator, validate, registerUser);
router.post('/verify-code', confirmCode);
router.post('/login', loginValidator, validate, loginUser);
router.post('/forgot-password', forgotPassword);   
router.post('/reset-password', resetPassword); 
router.post('/logout', logoutUser);


module.exports = router;

