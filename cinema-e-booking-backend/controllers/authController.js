const crypto = require('crypto');
const bcrypt = require('bcrypt');

const { sendEmail } = require('../services/emailService');
const db = require('../models'); 
const { signAccessToken, signRefreshToken } = require('../utils/jwt');

// Registration (create user + send confirmation email)
const registerUser = async (req, res) => {
  const { firstName, lastName, email, password, phone, promoOptIn, address, cards } = req.body;

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); 

  try {
    
    const existingUser = await db.sequelize.query(
      'SELECT * FROM users WHERE email = $1',
      { bind: [email], type: db.Sequelize.QueryTypes.SELECT }
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user 
    const [user] = await db.sequelize.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, phone, promo_opt_in, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, false)
      RETURNING id, email`,
      { bind: [firstName, lastName, email, hashedPassword, phone, promoOptIn || false], type: db.Sequelize.QueryTypes.SELECT }
    );

    if (!user || !user.email) {
      console.error('No email found for user!');
      return res.status(500).json({ message: 'Error: Email not defined for user.' });
    }

    // Handle optional address
    if (address && address.street) {
      console.log('Inserting address for user:', user.id);
      await db.sequelize.query(
        `INSERT INTO addresses (user_id, line1, city, state, zip, country)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        {
          bind: [
            user.id,
            address.street,
            address.city,
            address.state,
            address.zip,
            address.country || 'USA', // default country if not provided
          ],
          type: db.Sequelize.QueryTypes.INSERT,
        }
      );
    }

    // Handle optional payment cards (max 3)
    if (cards && Array.isArray(cards) && cards.length > 0) {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(process.env.CARD_SECRET || 'default-secret', 'salt', 32);
      
      for (const card of cards.slice(0, 3)) { // Limit to 3 cards
        if (card.cardNumber) {
          const iv = crypto.randomBytes(16);
          let cipher = crypto.createCipheriv(algorithm, key, iv);
          let encrypted = cipher.update(card.cardNumber.replace(/\s/g, ''), 'utf8', 'hex');
          encrypted += cipher.final('hex');

          await db.sequelize.query(
            `INSERT INTO payment_cards (user_id, card_type, card_number_encrypted, expiration_date, is_default)
            VALUES ($1, $2, $3, $4, $5)`,
            { 
              bind: [
                user.id, 
                card.cardType, 
                `${iv.toString('hex')}:${encrypted}`, 
                card.expirationDate,
                card.isDefault || false
              ], 
              type: db.Sequelize.QueryTypes.INSERT 
            }
          );
        }
      }
    }

    // store verification code in DB
    await db.sequelize.query(
      `INSERT INTO email_confirmations (user_id, code, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
      { bind: [user.id, verificationCode], type: db.Sequelize.QueryTypes.INSERT }
    );

    await sendEmail({
      to: user.email,
      subject: 'Your Cinema E-Booking Verification Code',
      html: `
        <h2>Welcome, ${firstName} ${lastName}!</h2>
        <p>Your verification code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 3px;">${verificationCode}</h1>
        <p>This code expires in 24 hours.</p>
      `,
    });

    res.status(201).json({
      message: 'Registration successful! Please check your email for confirmation.',
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

const confirmCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    // get user id from email
    const [user] = await db.sequelize.query(
      `SELECT id FROM users WHERE email=$1`,
      { bind: [email], type: db.Sequelize.QueryTypes.SELECT }
    );

    if (!user) return res.status(400).json({ message: 'Invalid email.' });

    // check code validity
    const [record] = await db.sequelize.query(
      `SELECT * FROM email_confirmations
       WHERE user_id=$1 AND code=$2 AND expires_at > NOW() AND used=false`,
      { bind: [user.id, code], type: db.Sequelize.QueryTypes.SELECT }
    );

    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired verification code.' });
    }

    // mark as used
    await db.sequelize.query(
      `UPDATE email_confirmations SET used=true WHERE id=$1`,
      { bind: [record.id], type: db.Sequelize.QueryTypes.UPDATE }
    );

    // activate user
    await db.sequelize.query(
      `UPDATE users SET is_active=true WHERE id=$1`,
      { bind: [user.id], type: db.Sequelize.QueryTypes.UPDATE }
    );

    return res.status(200).json({ message: 'Email verified successfully!' });
  } catch (err) {
    console.error('Error verifying code:', err);
    res.status(500).json({ message: 'Server error verifying code.' });
  }
};

//  Login User
const loginUser = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    
    const users = await db.sequelize.query(
      'SELECT * FROM users WHERE email = $1',
      { bind: [email], type: db.Sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    
    if (!user.is_active) {
      return res.status(403).json({ message: 'Please confirm your email before logging in.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    //token durations
    const accessExpiry = rememberMe ? '7d' : '1h';
    const refreshExpiry = rememberMe ? '30d' : '7d';

    const payload = { id: user.id, email: user.email, is_admin: user.is_admin };
    const accessToken = signAccessToken(payload, rememberMe ? '7d' : '1h');
    const refreshToken = signRefreshToken(payload, rememberMe ? '30d' : '7d');

    await db.sequelize.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '${rememberMe ? 30 : 7} days')`,
      { bind: [user.id, refreshToken], type: db.Sequelize.QueryTypes.INSERT }
    );

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      role: user.is_admin ? 'admin' : 'user'
    });

    console.log(` ${user.email} logged in successfully`);
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const users = await db.sequelize.query(
      'SELECT * FROM users WHERE email = $1',
      { bind: [email], type: db.Sequelize.QueryTypes.SELECT }
    );
    if (users.length === 0) {
      return res.status(200).json({ message: 'If this email exists, a reset link will be sent.' });
    }

    const user = users[0];

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); 

    await db.sequelize.query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      { bind: [user.id, token, expiresAt], type: db.Sequelize.QueryTypes.INSERT }
    );

  const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
  const resetLink = `${frontendBase}/pages/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Reset your Cinema E-Booking password',
      html: `
        <h3>Hello ${user.first_name || ''},</h3>
        <p>You requested to reset your password. Click below to set a new one:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 1 hour.</p>
      `,
    });

    console.log(` Password reset email sent to ${user.email}`);
    return res.status(200).json({ message: 'Password reset email sent (if email exists).' });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ message: 'Server error sending reset link.' });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    
    const results = await db.sequelize.query(
      `SELECT prt.*, u.email 
      FROM password_resets prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token=$1 AND prt.used=false AND prt.expires_at > NOW()`,
      { bind: [token], type: db.Sequelize.QueryTypes.SELECT }
    );


    if (results.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    const resetRecord = results[0];

    // Hash new password using bcrypt and store the resulting hash directly
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Store the bcrypt hash directly in the password_hash column (login uses bcrypt.compare)
    await db.sequelize.query(
      `UPDATE users SET password_hash=$1 WHERE id=$2`,
      { bind: [hashedPassword, resetRecord.user_id], type: db.Sequelize.QueryTypes.UPDATE }
    );

    await db.sequelize.query(
      `UPDATE password_resets SET used=true WHERE id=$1`,
      { bind: [resetRecord.id], type: db.Sequelize.QueryTypes.UPDATE }
    );

    await sendEmail({
      to: resetRecord.email,
      subject: 'Your Cinema E-Booking password was reset',
      html: `<p>Your password has been successfully reset. If you didn’t do this, contact support.</p>`,
    });

    console.log(`Password reset successful for user ${resetRecord.user_id}`);
    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ message: 'Server error resetting password.' });
  }
};

// Logout
const logoutUser = async (req, res) => {
  const { refreshToken } = req.body; 

  try {
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    await db.sequelize.query(
      `DELETE FROM refresh_tokens WHERE token = $1`,
      { bind: [refreshToken], type: db.Sequelize.QueryTypes.DELETE }
    );

    console.log(`🚪 Logout successful. Refresh token invalidated.`);
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ message: 'Server error during logout.' });
  }
};

module.exports = { registerUser, confirmCode , loginUser, forgotPassword, resetPassword, logoutUser};
