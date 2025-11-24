const db = require('../models');
const { v4: uuidv4 } = require('uuid');

// Helper function to generate seats for a show based on its showroom layout
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

    // Create show-specific seats based on hall layout
    const showSeatsData = hallSeats.map(seat => ({
      id: uuidv4(),
      show_id: showId,
      row_label: seat.row_label,
      seat_number: seat.seat_number,
      is_available: true
    }));

    // Batch insert all seats
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

    // Fetch show with showroom information
    const show = await db.Show.findByPk(show_id, {
      include: [{
        model: db.Showroom,
        attributes: ['id', 'name', 'capacity']
      }]
    });
    
    if (!show) return res.status(404).json({ message: 'Show not found' });

    // Get show-specific seats instead of hall seats
    const seats = await db.sequelize.query(
      `SELECT id, row_label, seat_number, is_available
       FROM show_seats
       WHERE show_id = $1
       ORDER BY row_label, seat_number`,
      { bind: [show_id], type: db.Sequelize.QueryTypes.SELECT }
    );

    // If no show-specific seats exist, generate them from the hall template
    if (seats.length === 0) {
      console.log(`No seats found for show ${show_id}, generating from hall template...`);
      await generateSeatsForShow(show_id, show.showroom_id);
      
      // Retry fetching seats
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


exports.reserveSeats = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { user_id, show_id, seat_ids, ticket_category, price } = req.body;
    if (!user_id || !show_id || !Array.isArray(seat_ids) || seat_ids.length === 0)
      return res.status(400).json({ message: 'Invalid booking request' });

    // Check that all seats are available for this specific show
    const seats = await db.sequelize.query(
      `SELECT id, is_available, row_label, seat_number FROM show_seats WHERE id = ANY($1) AND show_id = $2 FOR UPDATE`,
      { bind: [seat_ids, show_id], type: db.Sequelize.QueryTypes.SELECT, transaction: t }
    );

    // Verify all requested seats exist for this show
    if (seats.length !== seat_ids.length) {
      await t.rollback();
      return res.status(400).json({ message: 'Some seats do not exist for this show' });
    }

    const unavailable = seats.filter(s => !s.is_available);
    if (unavailable.length) {
      await t.rollback();
      return res.status(409).json({ message: 'Some seats are already booked', unavailable });
    }

    // Mark seats unavailable for this specific show
    await db.sequelize.query(
      `UPDATE show_seats SET is_available = false WHERE id = ANY($1) AND show_id = $2`,
      { bind: [seat_ids, show_id], transaction: t }
    );

    // Create booking record
    const bookingId = uuidv4();
    const totalAmount = seat_ids.length * parseFloat(price || 0);
    await db.sequelize.query(
      `INSERT INTO bookings (id, user_id, show_id, total_amount, status)
       VALUES ($1, $2, $3, $4, 'CONFIRMED')`,
      { bind: [bookingId, user_id, show_id, totalAmount], transaction: t }
    );

    // Create tickets using the seat data we already have
    for (const seat of seats) {
      const seatLabel = `${seat.row_label}${seat.seat_number}`;
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

// Export the seat generation function for use by admin controllers
exports.generateSeatsForShow = generateSeatsForShow;
