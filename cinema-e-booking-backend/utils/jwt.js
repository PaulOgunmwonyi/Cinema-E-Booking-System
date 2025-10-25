const jwt = require('jsonwebtoken');
require('dotenv').config();

const signAccessToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '15m') => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not defined in .env');
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const signRefreshToken = (payload, expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d') => {
  if (!process.env.REFRESH_TOKEN_SECRET) throw new Error('REFRESH_TOKEN_SECRET not defined in .env');
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn });
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET); 
  } catch (err) {
    console.error('Token verification failed:', err.message);
    throw err;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    console.error('Refresh token verification failed:', err.message);
    throw err;
  }
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
