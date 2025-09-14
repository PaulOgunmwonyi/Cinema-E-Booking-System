const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./models'); // Sequelize instance
require('dotenv').config();


const app = express();
app.use(bodyParser.json());

// Import routes
const movieRoutes = require('./routes/movies');
const genreRoutes = require('./routes/genres');
const showRoutes = require('./routes/shows');

// Use routes
app.use('/movies', movieRoutes);
app.use('/genres', genreRoutes);
app.use('/shows', showRoutes);

// Test DB connection and start server
const PORT = process.env.PORT || 5000;
sequelize.authenticate().then(() => {
  console.log(' Database connected');
  app.listen(PORT, () => console.log(` Server running on http://localhost:${PORT}`));
}).catch(err => console.error('❌ DB connection failed:', err));
