const { validationResult } = require('express-validator');
const db = require('../../models');
const { sendEmail } = require('../../services/emailService');

// Create promotion
const createPromotion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ message: 'Validation failed.', errors: errors.mapped() });

  const { code, title, description, start_date, end_date, discount_percent } = req.body;

  try {
    const promo = await db.Promotion.create({ code, title, description, start_date, end_date, discount_percent });
    return res.status(201).json({ message: 'Promotion created', promotion: promo });
  } catch (e) {
    if (String(e).includes('unique') && String(e).includes('code')) {
      return res.status(400).json({ message: 'Promo code already exists' });
    }
    console.error('createPromotion error:', e);
    return res.status(500).json({ message: 'Server error creating promotion' });
  }
};

// Send promotion to subscribed users only
const sendPromotion = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(422).json({ message: 'code is required' });

  try {
    const promo = await db.Promotion.findOne({ where: { code } });
    if (!promo) return res.status(404).json({ message: 'Promotion not found' });

    const subscribers = await db.sequelize.query(
      `SELECT email, first_name FROM users WHERE promo_opt_in = true AND is_suspended = false`,
      { type: db.Sequelize.QueryTypes.SELECT }
    );

    const html = `
      <h2>${promo.title}</h2>
      <p>${promo.description || ''}</p>
      <p><strong>Use code:</strong> ${promo.code}</p>
      <p>Valid: ${new Date(promo.start_date).toLocaleDateString()} - ${new Date(promo.end_date).toLocaleDateString()}</p>
      <p><strong>Discount:</strong> ${promo.discount_percent}%</p>
    `;

    let sent = 0;
    for (const u of subscribers) {
      try {
        await sendEmail({
          to: u.email,
          subject: `Exclusive Offer: ${promo.title}`,
          html
        });
        // record success
        await db.PromotionEmail.create({
          promotion_id: promo.id,
          user_email: u.email,
          user_first_name: u.first_name,
          status: 'sent',
        });
        sent++;
      } catch (sendErr) {
        console.error(`Failed to send promotion to ${u.email}:`, sendErr);
        // record failure
        try {
          await db.PromotionEmail.create({
            promotion_id: promo.id,
            user_email: u.email,
            user_first_name: u.first_name,
            status: 'failed',
            error_message: String(sendErr?.message || sendErr),
          });
        } catch (recErr) {
          console.error('Failed to record promotion email failure:', recErr);
        }
        // continue sending to other users
      }
    }

    return res.json({ message: `Promotion send attempts complete. Successful: ${sent}, Total: ${subscribers.length}` });
  } catch (e) {
    console.error('sendPromotion error:', e);
    return res.status(500).json({ message: 'Server error sending promotion' });
  }
};

// List promotions
const listPromotions = async (req, res) => {
  try {
    const promos = await db.Promotion.findAll({ order: [['created_at', 'DESC']] });
    return res.json({ promotions: promos });
  } catch (e) {
    console.error('listPromotions error:', e);
    return res.status(500).json({ message: 'Server error listing promotions' });
  }
};

module.exports = { createPromotion, sendPromotion, listPromotions };
