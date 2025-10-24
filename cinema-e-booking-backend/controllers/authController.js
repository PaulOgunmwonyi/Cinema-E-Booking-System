const crypto = require('crypto');
const bcrypt = require('bcrypt');

const { generateEmailToken, verifyEmailToken } = require('../utils/jwt');
const { sendEmail } = require('../services/emailService');
const db = require('../models'); 
const { signAccessToken, signRefreshToken } = require('../utils/jwt');

// Registration (create user + send confirmation email)
const registerUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

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
    const userResult = await db.sequelize.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, is_active)
      VALUES ($1, $2, $3, $4, false)
      RETURNING id, email`,
      { bind: [firstName, lastName, email, hashedPassword], type: db.Sequelize.QueryTypes.INSERT }
    );

    const user = Array.isArray(userResult[0]) ? userResult[0][0] : userResult[0];
    console.log('User returned from DB:', user);

    if (!user || !user.email) {
      console.error('No email found for user!');
      return res.status(500).json({ message: 'Error: Email not defined for user.' });
    }

    //Generate confirmation token
    const token = generateEmailToken(user.id);

    //  Store token in email_confirmations table
    await db.sequelize.query(
      `INSERT INTO email_confirmations (user_id, token, expires_at, created_at)
      VALUES ($1, $2, NOW() + INTERVAL '24 hours', NOW())`,
      { bind: [user.id, token], type: db.Sequelize.QueryTypes.INSERT }
    );

    //  Send confirmation email
    const confirmLink = `http://localhost:5001/api/auth/confirm?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Confirm your Cinema E-Booking account',
      html: `
        <h2>Welcome, ${firstName} ${lastName}!</h2>
        <p>Please confirm your email by clicking the link below:</p>
        <a href="${confirmLink}">Confirm Email</a>
        <p>This link expires in 24 hours.</p>
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

// Confirm Email (verify token)
const confirmEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = verifyEmailToken(token);
    if (!decoded) return res.status(400).json({ message: 'Invalid or expired token' });

    const userId = decoded.id;

    // Check token in DB
    const result = await db.sequelize.query(
      `SELECT * FROM email_confirmations WHERE user_id=$1 AND token=$2 AND expires_at > NOW()`,
      { bind: [userId, token], type: db.Sequelize.QueryTypes.SELECT }
    );

    if (result.length === 0)
      return res.status(400).json({ message: 'Invalid or expired token' });

    // Activate user
    await db.sequelize.query(
      `UPDATE users SET is_active = true WHERE id = $1`,
      { bind: [userId], type: db.Sequelize.QueryTypes.UPDATE }
    );

    // Optionally delete token entry
    await db.sequelize.query(`DELETE FROM email_confirmations WHERE user_id=$1`, 
      {bind: [userId], type: db.Sequelize.QueryTypes.DELETE}
    );

    console.log(` User ${userId} email confirmed.`);

    return res.status(200).json({ message: 'Email confirmed successfully!' });
  } catch (error) {
    console.error('Error confirming email:', error);
    return res.status(500).json({ message: 'Server error confirming email.' });
  }
};

//  Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;

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

    const payload = { id: user.id, email: user.email, is_admin: user.is_admin };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await db.sequelize.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
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

    const resetLink = `http://localhost:5001/reset-password?token=${token}`; 

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

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await db.sequelize.query(
      `UPDATE users SET password_hash=crypt($1, gen_salt('bf')) WHERE id=$2`,
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

module.exports = { registerUser, confirmEmail , loginUser, forgotPassword, resetPassword, logoutUser};
