const jwt = require('jsonwebtoken');
const config = require('../config');
const dotenv = require('dotenv');

dotenv.config();

function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

function signRefreshToken(payload) {
  return jwt.sign(payload, config.refreshToken.secret, { expiresIn: config.refreshToken.expiresIn });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.refreshToken.secret);
}

function generateEmailToken(userId) {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_EMAIL_SECRET,
    { expiresIn: '1d' } 
  );
  return token;
}

function verifyEmailToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_EMAIL_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateEmailToken,
  verifyEmailToken,
};
