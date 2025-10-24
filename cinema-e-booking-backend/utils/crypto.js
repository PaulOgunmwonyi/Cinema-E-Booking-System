const crypto = require('crypto');
const config = require('../config');

if (!config.cardEncryption.keyBase64) {
  throw new Error('CARD_ENCRYPTION_KEY_BASE64 is required in env');
}
const KEY = Buffer.from(config.cardEncryption.keyBase64, 'base64'); 
const IV_LEN = 12; 
const TAG_LEN = 16;

function encryptCard(plaintext) {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptCard(data) {
  const b = Buffer.from(data, 'base64');
  const iv = b.slice(0, IV_LEN);
  const tag = b.slice(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = b.slice(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString('utf8');
}

module.exports = { encryptCard, decryptCard };
