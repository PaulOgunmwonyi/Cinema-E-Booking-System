const db = require('../models');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /api/bookings/seats/:show_id
 * Returns all seats for the hall linked to the show_id,
 * grouped by row_label with availability info.
 */
exports.fetchAvailableSeats = async (req, res) => {
  try {
    const show_id = req.params.show_id.trim();

    // find hall (or showroom) for this show
    const show = await db.Show.findByPk(show_id);
    if (!show) return res.status(404).json({ message: 'Show not found' });

    // get hall_id or showroom_id
    const hallId = show.showroom_id;

    const seats = await db.sequelize.query(
      `SELECT id, row_label, seat_number, is_available
       FROM hall_seats
       WHERE hall_id = $1
       ORDER BY row_label, seat_number`,
      { bind: [hallId], type: db.Sequelize.QueryTypes.SELECT }
    );

    return res.json({ show_id, seats });
  } catch (err) {
    console.error('fetchAvailableSeats error:', err);
    return res.status(500).json({ message: 'Server error fetching seats' });
  }
};

/**
 * POST /api/bookings/reserve
 * Body:
 * {
 *   "user_id": "uuid",
 *   "show_id": "uuid",
 *   "seat_ids": ["uuid1", "uuid2"],
 *   "ticket_category": "Adult",
 *   "price": 12.50
 * }
 */
exports.reserveSeats = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { user_id, show_id, seat_ids, ticket_category, price } = req.body;
    if (!user_id || !show_id || !Array.isArray(seat_ids) || seat_ids.length === 0)
      return res.status(400).json({ message: 'Invalid booking request' });

    // Check that all seats are available
    const seats = await db.sequelize.query(
      `SELECT id, is_available FROM hall_seats WHERE id = ANY($1) FOR UPDATE`,
      { bind: [seat_ids], type: db.Sequelize.QueryTypes.SELECT, transaction: t }
    );

    const unavailable = seats.filter(s => !s.is_available);
    if (unavailable.length)
      return res.status(409).json({ message: 'Some seats are already booked', unavailable });

    // Mark seats unavailable
    await db.sequelize.query(
      `UPDATE hall_seats SET is_available = false WHERE id = ANY($1)`,
      { bind: [seat_ids], transaction: t }
    );

    // Create booking record
    const bookingId = uuidv4();
    const totalAmount = seat_ids.length * parseFloat(price || 0);
    await db.sequelize.query(
      `INSERT INTO bookings (id, user_id, show_id, total_amount, status)
       VALUES ($1, $2, $3, $4, 'CONFIRMED')`,
      { bind: [bookingId, user_id, show_id, totalAmount], transaction: t }
    );

    // Create tickets
    for (const seatId of seat_ids) {
      const seat = await db.sequelize.query(
        `SELECT row_label, seat_number FROM hall_seats WHERE id = $1`,
        { bind: [seatId], type: db.Sequelize.QueryTypes.SELECT, transaction: t }
      );
      const seatLabel = `${seat[0].row_label}${seat[0].seat_number}`;
      await db.sequelize.query(
        `INSERT INTO tickets (id, booking_id, show_id, seat_number, ticket_category, price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        {
          bind: [uuidv4(), bookingId, show_id, seatLabel, ticket_category, price],
          transaction: t
        }
      );
    }

    await t.commit();
    return res.status(201).json({ message: 'Booking confirmed', booking_id: bookingId });
  } catch (err) {
    await t.rollback();
    console.error('reserveSeats error:', err);
    return res.status(500).json({ message: 'Server error reserving seats' });
  }
};
