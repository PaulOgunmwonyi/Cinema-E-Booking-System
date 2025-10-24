const crypto = require('crypto');
const config = require('../config');

function randomTokenHex(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex'); 
}

function generateEmailToken() {
  return randomTokenHex(config.tokens.emailTokenBytes);
}
function generatePasswordResetToken() {
  return randomTokenHex(config.tokens.passwordResetBytes);
}

module.exports = { generateEmailToken, generatePasswordResetToken, randomTokenHex };
