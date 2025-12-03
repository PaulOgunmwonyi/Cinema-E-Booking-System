const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { sendEmail } = require('../services/emailService');

const generateSeatsForShow = async (showId, showroomId) => {
  try {
    // Get all hall seats for the showroom
    const hallSeats = await db.sequelize.query(
      `SELECT row_label, seat_number FROM hall_seats WHERE hall_id = $1 ORDER BY row_label, seat_number`,
      { bind: [showroomId], type: db.Sequelize.QueryTypes.SELECT }
    );

    if (hallSeats.length === 0) {
      console.log(`No hall seats found for showroom ${showroomId}`);
      return;
    }

    // show-specific seats based on hall layout
    const showSeatsData = hallSeats.map(seat => ({
      id: uuidv4(),
      show_id: showId,
      row_label: seat.row_label,
      seat_number: seat.seat_number,
      is_available: true
    }));

    await db.sequelize.query(
      `INSERT INTO show_seats (id, show_id, row_label, seat_number, is_available) 
       VALUES ${showSeatsData.map(() => '(?, ?, ?, ?, ?)').join(', ')}`,
      {
        replacements: showSeatsData.flatMap(seat => [
          seat.id, seat.show_id, seat.row_label, seat.seat_number, seat.is_available
        ]),
        type: db.Sequelize.QueryTypes.INSERT
      }
    );

    console.log(`Generated ${hallSeats.length} seats for show ${showId}`);
  } catch (error) {
    console.error('Error generating seats for show:', error);
    throw error;
  }
};



exports.fetchAvailableSeats = async (req, res) => {
  try {
    const show_id = req.params.show_id.trim();

    const show = await db.Show.findByPk(show_id, {
      include: [{
        model: db.Showroom,
        attributes: ['id', 'name', 'capacity']
      }]
    });
    
    if (!show) return res.status(404).json({ message: 'Show not found' });

    const seats = await db.sequelize.query(
      `SELECT id, row_label, seat_number, is_available
       FROM show_seats
       WHERE show_id = $1
       ORDER BY row_label, seat_number`,
      { bind: [show_id], type: db.Sequelize.QueryTypes.SELECT }
    );

    if (seats.length === 0) {
      console.log(`No seats found for show ${show_id}, generating from hall template...`);
      await generateSeatsForShow(show_id, show.showroom_id);
      
      const newSeats = await db.sequelize.query(
        `SELECT id, row_label, seat_number, is_available
         FROM show_seats
         WHERE show_id = $1
         ORDER BY row_label, seat_number`,
        { bind: [show_id], type: db.Sequelize.QueryTypes.SELECT }
      );
      
      return res.json({ 
        show_id, 
        seats: newSeats,
        showroom: {
          id: show.Showroom.id,
          name: show.Showroom.name,
          capacity: show.Showroom.capacity
        }
      });
    }

    return res.json({ 
      show_id, 
      seats,
      showroom: {
        id: show.Showroom.id,
        name: show.Showroom.name,
        capacity: show.Showroom.capacity
      }
    });
  } catch (err) {
    console.error('fetchAvailableSeats error:', err);
    return res.status(500).json({ message: 'Server error fetching seats' });
  }
};


//reserve seats
exports.reserveSeats = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { user_id, show_id, tickets, promotion_code = null, payment = {} } = req.body;

    if (!user_id || !show_id || !Array.isArray(tickets) || tickets.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "Invalid booking request" });
    }

    // LOCK SEATS 
    const seat_ids = tickets.map(t => t.seat_id);

    const seats = await db.sequelize.query(
      `SELECT id, is_available, row_label, seat_number 
       FROM show_seats 
       WHERE id = ANY($1) AND show_id = $2 
       FOR UPDATE`,
      {
        bind: [seat_ids, show_id],
        type: db.Sequelize.QueryTypes.SELECT,
        transaction: t
      }
    );

    if (seats.length !== seat_ids.length) {
      await t.rollback();
      return res.status(400).json({ message: "Some seats do not exist for this show" });
    }

    // Check availability
    const unavailable = seats.filter(s => !s.is_available);
    if (unavailable.length > 0) {
      await t.rollback();
      return res.status(409).json({
        message: "Some seats are already booked",
        unavailable
      });
    }

    await db.sequelize.query(
      `UPDATE show_seats SET is_available = false 
       WHERE id = ANY($1) AND show_id = $2`,
      {
        bind: [seat_ids, show_id],
        transaction: t
      }
    );

    const subtotal = tickets.reduce((sum, t) => sum + parseFloat(t.price), 0);

    let booking_fee = 0;
    const feeRow = await db.sequelize.query(
      `SELECT fee FROM booking_fees ORDER BY created_at DESC LIMIT 1`,
      { type: db.Sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (feeRow.length > 0) {
      booking_fee = parseFloat(feeRow[0].fee);
    }

    // Prepare for discount & tax calculation
    let discount_amount = 0;
    let promotion_id = null;

    if (promotion_code && promotion_code.trim() !== "") {
      const promos = await db.sequelize.query(
        `SELECT id, discount_percent, discount_amount
         FROM promotions
         WHERE code = $1
           AND CURRENT_DATE BETWEEN start_date AND end_date`,
        {
          bind: [promotion_code.trim()],
          type: db.Sequelize.QueryTypes.SELECT,
          transaction: t
        }
      );

      if (promos.length === 0) {
        await t.rollback();
        return res.status(400).json({ message: "Invalid or expired promo code" });
      }

      const promo = promos[0];
      promotion_id = promo.id;

      // Verify user opted in to promotions (promo_opt_in = true)
      const userRow = await db.sequelize.query(
        `SELECT email, first_name, promo_opt_in FROM users WHERE id = $1`,
        {
          bind: [user_id],
          type: db.Sequelize.QueryTypes.SELECT,
          transaction: t
        }
      );

      if (userRow.length === 0) {
        await t.rollback();
        return res.status(400).json({ message: 'Invalid user for promo validation' });
      }

      const userEmail = userRow[0].email;
      const promoOptIn = !!userRow[0].promo_opt_in;

      if (!promoOptIn) {
        await t.rollback();
        return res.status(403).json({ message: 'User not opted in for promotions' });
      }

      if (promo.discount_percent) {
        discount_amount += subtotal * (promo.discount_percent / 100);
      }
      if (promo.discount_amount) {
        discount_amount += parseFloat(promo.discount_amount);
      }

      if (discount_amount > subtotal) discount_amount = subtotal;
    }

    discount_amount = parseFloat(discount_amount.toFixed(2));

    // Apply discount before tax: subtract discount from subtotal, then compute tax on the discounted subtotal
    const TAX_RATE = 7.0 / 100;
    const discounted_subtotal = parseFloat(Math.max(0, subtotal - discount_amount).toFixed(2));
    const tax_amount = parseFloat((discounted_subtotal * TAX_RATE).toFixed(2));

    const total_amount = parseFloat(
      (discounted_subtotal + tax_amount + booking_fee).toFixed(2)
    );

    // Handle payment information
    let payment_card_id = null;
    
    if (payment && payment.payment_card_id) {
      // Using existing saved card
      payment_card_id = payment.payment_card_id;
      
      // Verify the card belongs to the user
      const cardCheck = await db.sequelize.query(
        `SELECT id FROM payment_cards WHERE id = $1 AND user_id = $2`,
        {
          bind: [payment_card_id, user_id],
          type: db.Sequelize.QueryTypes.SELECT,
          transaction: t
        }
      );
      
      if (cardCheck.length === 0) {
        await t.rollback();
        return res.status(400).json({ message: "Invalid payment card selected" });
      }
    } else if (payment && payment.card_number && payment.expiration_date && payment.cvv) {
      console.log('Processing payment with new card details (not stored)');
    }

    // BOOKING 
    const booking_id = uuidv4();

    await db.sequelize.query(
      `INSERT INTO bookings (
         id, user_id, show_id, total_amount, promotion_id,
         tax_amount, booking_fee, discount_amount, payment_card_id, status
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'CONFIRMED')`,
      {
        bind: [
          booking_id,
          user_id,
          show_id,
          total_amount,
          promotion_id,
          tax_amount,
          booking_fee,
          discount_amount,
          payment_card_id
        ],
        transaction: t
      }
    );

    for (const tkt of tickets) {
      const seat = seats.find(s => s.id === tkt.seat_id);
      const label = `${seat.row_label}${seat.seat_number}`;

      await db.sequelize.query(
        `INSERT INTO tickets (
           id, booking_id, show_id, seat_number, ticket_category, price
         )
         VALUES ($1,$2,$3,$4,$5,$6)`,
        {
          bind: [
            uuidv4(),
            booking_id,
            show_id,
            label,
            tkt.ticket_category,
            tkt.price
          ],
          transaction: t
        }
      );
    }

    await t.commit();

    const bookingNumRow = await db.sequelize.query(
      `SELECT booking_number FROM bookings WHERE id = $1`,
      {
        bind: [booking_id],
        type: db.Sequelize.QueryTypes.SELECT
      }
    );

    return res.status(201).json({
      message: "Booking confirmed",
      booking_id,
      booking_number: bookingNumRow[0].booking_number,
      subtotal,
      tax_amount,
      booking_fee,
      discount_amount,
      total_amount
    });

  } catch (err) {
    if (!t.finished) {
      await t.rollback();
    }
    console.error("reserveSeats error:", err);
    return res.status(500).json({ message: "Server error reserving seats" });
  }
};


exports.getOrderHistory = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const bookings = await db.sequelize.query(
      `SELECT 
         b.id,
         b.booking_number,
         b.total_amount,
         b.tax_amount,
         b.booking_fee,
         b.discount_amount,
         b.status,
         b.created_at,
         m.title AS movie_title,
         s.start_time,
         s.end_time,
         sr.name AS showroom_name
       FROM bookings b
       JOIN shows s ON b.show_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN showrooms sr ON s.showroom_id = sr.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      {
        bind: [userId],
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    return res.json({ bookings });
  } catch (err) {
    console.error('getOrderHistory error:', err);
    return res.status(500).json({ message: 'Server error fetching order history' });
  }
};

exports.getBookingDetails = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const bookingId = req.params.booking_id.trim();

    const [booking] = await db.sequelize.query(
      `SELECT 
         b.id,
         b.booking_number,
         b.total_amount,
         b.tax_amount,
         b.booking_fee,
         b.discount_amount,
         b.status,
         b.created_at,
         m.title AS movie_title,
         s.start_time,
         s.end_time,
         sr.name AS showroom_name,
         p.code AS promotion_code
       FROM bookings b
       JOIN shows s ON b.show_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN showrooms sr ON s.showroom_id = sr.id
       LEFT JOIN promotions p ON b.promotion_id = p.id
       WHERE b.id = $1 AND b.user_id = $2`,
      {
        bind: [bookingId, userId],
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const tickets = await db.sequelize.query(
      `SELECT seat_number, ticket_category, price
       FROM tickets
       WHERE booking_id = $1
       ORDER BY seat_number`,
      {
        bind: [bookingId],
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    return res.json({ booking, tickets });
  } catch (err) {
    console.error('getBookingDetails error:', err);
    return res
      .status(500)
      .json({ message: 'Server error fetching booking details' });
  }
};

// Validate a promotion code for the logged-in user (quick check for UI)
exports.validatePromo = async (req, res) => {
  try {
    const user = req.user;
    const { promotion_code, subtotal } = req.body;

    console.log('validatePromo called by:', user && user.email ? user.email : 'unknown', 'body:', { promotion_code, subtotal });

    if (!user || !user.email) return res.status(401).json({ message: 'Unauthorized' });
    if (!promotion_code || promotion_code.trim() === '') return res.status(422).json({ message: 'promotion_code is required' });

    const promos = await db.sequelize.query(
      `SELECT id, discount_percent, discount_amount, code
       FROM promotions
       WHERE code = $1
         AND CURRENT_DATE BETWEEN start_date AND end_date`,
      {
        bind: [promotion_code.trim()],
        type: db.Sequelize.QueryTypes.SELECT
      }
    );

    if (promos.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired promo code' });
    }

    const promo = promos[0];
    // Check that the logged-in user has opted in to promotions
    const userRows = await db.sequelize.query(
      `SELECT promo_opt_in FROM users WHERE id = $1`,
      { bind: [user.id], type: db.Sequelize.QueryTypes.SELECT }
    );

    if (!userRows || userRows.length === 0) {
      return res.status(400).json({ message: 'Invalid user for promo validation' });
    }

    const promoOptIn = !!userRows[0].promo_opt_in;
    if (!promoOptIn) {
      return res.status(403).json({ message: 'User not opted in for promotions' });
    }

    // Calculate discount if subtotal provided, otherwise return promo details
    let discount_amount = null;
    if (typeof subtotal === 'number') {
      discount_amount = 0;
      if (promo.discount_percent) discount_amount += subtotal * (parseFloat(promo.discount_percent) / 100);
      if (promo.discount_amount) discount_amount += parseFloat(promo.discount_amount);
      if (discount_amount > subtotal) discount_amount = subtotal;
      discount_amount = parseFloat(discount_amount.toFixed(2));
    }

    return res.json({
      promotion: {
        id: promo.id,
        code: promo.code,
        discount_percent: promo.discount_percent ? parseFloat(promo.discount_percent) : null,
        discount_amount: promo.discount_amount ? parseFloat(promo.discount_amount) : null
      },
      discount_amount
    });
  } catch (err) {
    console.error('validatePromo error:', err);
    const msg = err && err.message ? err.message : 'Server error validating promo';
    return res.status(500).json({ message: msg });
  }
};

exports.generateSeatsForShow = generateSeatsForShow;