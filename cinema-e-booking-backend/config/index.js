require('dotenv').config();

const toInt = v => (v ? parseInt(v, 10) : undefined);

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT) || 5001,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  },
  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET,
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  },
  cardEncryption: {
    keyBase64: process.env.CARD_ENCRYPTION_KEY_BASE64,
  },
  tokens: {
    emailTokenBytes: parseInt(process.env.EMAIL_TOKEN_BYTES || '32', 10),
    passwordResetBytes: parseInt(process.env.PASSWORD_RESET_TOKEN_BYTES || '32', 10),
  },
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
};
