const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../models');
const { sendEmail } = require('../services/emailService'); // <-- import sendEmail

// GET /api/profile/me
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user + address + cards
    const [user] = await db.sequelize.query(
      `SELECT id, first_name, last_name, email, promo_opt_in
       FROM users WHERE id = $1`,
      { bind: [userId], type: db.Sequelize.QueryTypes.SELECT }
    );

    const [address] = await db.sequelize.query(
        `SELECT id, line1 AS street, city, state, zip
        FROM addresses WHERE user_id=$1 LIMIT 1`,
        { bind: [userId], type: db.Sequelize.QueryTypes.SELECT }
    );

    const cards = await db.sequelize.query(
      `SELECT id, card_type, expiration_date
       FROM payment_cards WHERE user_id = $1`,
      { bind: [userId], type: db.Sequelize.QueryTypes.SELECT }
    );

    res.json({ user, address, cards });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error fetching profile.' });
  }
};

// PUT /api/profile/edit
const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, password, address, card, promoOptIn } = req.body;

  try {
    // ✅ Update name and promo preference
    await db.sequelize.query(
      `UPDATE users SET 
         first_name = COALESCE($1, first_name),
         last_name = COALESCE($2, last_name),
         promo_opt_in = COALESCE($3, promo_opt_in),
         updated_at = NOW()
       WHERE id = $4`,
      { bind: [firstName, lastName, promoOptIn, userId], type: db.Sequelize.QueryTypes.UPDATE }
    );

    // ✅ Update password if provided
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await db.sequelize.query(
        `UPDATE users SET password_hash = $1 WHERE id = $2`,
        { bind: [hashed, userId], type: db.Sequelize.QueryTypes.UPDATE }
      );
    }

    // ✅ Address logic (only one per user)
    if (address && address.street) {
      const existingAddress = await db.sequelize.query(
        `SELECT id FROM addresses WHERE user_id=$1`,
        { bind: [userId], type: db.Sequelize.QueryTypes.SELECT }
      );

      if (existingAddress.length > 0) {
        await db.sequelize.query(
          `UPDATE addresses 
           SET line1=$1, city=$2, state=$3, zip=$4, updated_at=NOW()
           WHERE user_id=$5`,
          { bind: [address.street, address.city, address.state, address.zip, userId], type: db.Sequelize.QueryTypes.UPDATE }
        );
      } else {
        await db.sequelize.query(
          `INSERT INTO addresses (user_id, line1, city, state, zip)
           VALUES ($1, $2, $3, $4, $5)`,
          { bind: [userId, address.street, address.city, address.state, address.zip], type: db.Sequelize.QueryTypes.INSERT }
        );
      }
    }

    // ✅ Card logic (max 4 cards)
    if (card && card.cardNumber) {
      const existingCards = await db.sequelize.query(
        `SELECT COUNT(*) AS count FROM payment_cards WHERE user_id=$1`,
        { bind: [userId], type: db.Sequelize.QueryTypes.SELECT }
      );

      const cardCount = parseInt(existingCards[0].count);
      if (cardCount >= 4) {
        return res.status(400).json({ message: 'You cannot store more than 4 payment cards.' });
      }

      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(process.env.CARD_SECRET, 'salt', 32);
      const iv = crypto.randomBytes(16);
      let cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(card.cardNumber, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      await db.sequelize.query(
        `INSERT INTO payment_cards (user_id, card_type, card_number_encrypted, expiration_date)
         VALUES ($1, $2, $3, $4)`,
        { bind: [userId, card.cardType, `${iv.toString('hex')}:${encrypted}`, card.expirationDate], type: db.Sequelize.QueryTypes.INSERT }
      );
    }

    // ✅ Fetch user's email for notification
    const [user] = await db.sequelize.query(
      `SELECT email, first_name FROM users WHERE id = $1`,
      { bind: [userId], type: db.Sequelize.QueryTypes.SELECT }
    );

    // ✅ Send notification email
    await sendEmail({
      to: user.email,
      subject: 'Your Cinema E-Booking profile was updated',
      html: `
        <h2>Hello ${user.first_name},</h2>
        <p>Your profile information has been changed.</p>
        <p>If you did not make this change, please contact support immediately.</p>
      `,
    });

    res.status(200).json({ message: 'Profile updated successfully. Notification email sent.' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error updating profile.' });
  }
};

module.exports = { getProfile, updateProfile };
