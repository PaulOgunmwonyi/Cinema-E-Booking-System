const db = require('../models');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [user] = await db.sequelize.query(
      `SELECT id, first_name, last_name, email, is_admin, promo_opt_in, created_at, updated_at
       FROM users WHERE id=$1`,
      { bind: [userId], type: db.Sequelize.QueryTypes.SELECT }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    const addresses = await db.sequelize.query(
      `SELECT * FROM addresses WHERE user_id=$1`,
      { bind: [userId], type: db.Sequelize.QueryTypes.SELECT }
    );

    const cards = await db.sequelize.query(
      `SELECT card_last4, card_brand FROM payment_cards WHERE user_id=$1`,
      { bind: [userId], type: db.Sequelize.QueryTypes.SELECT }
    );

    return res.status(200).json({
      profile: user,
      addresses,
      payment_cards: cards,
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: 'Server error fetching profile.' });
  }
};

//  Update Profile
const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { first_name, last_name, promo_opt_in, email } = req.body;

  try {
   
    if (email) {
      return res.status(400).json({ message: 'Email cannot be changed.' });
    }

    const [updatedUser] = await db.sequelize.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           promo_opt_in = COALESCE($3, promo_opt_in),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, first_name, last_name, email, promo_opt_in`,
      { bind: [first_name, last_name, promo_opt_in, userId], type: db.Sequelize.QueryTypes.UPDATE }
    );

    res.status(200).json({
      message: 'Profile updated successfully!',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error updating profile.' });
  }
};

module.exports = { getProfile, updateProfile };
