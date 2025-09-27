const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sequelize } = require('./models'); 
require('dotenv').config();

const app = express();

app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true
}));

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Backend is working ");
});

const movieRoutes = require('./routes/movies');
const genreRoutes = require('./routes/genres');
const showRoutes = require('./routes/shows');

app.use('/movies', movieRoutes);
app.use('/genres', genreRoutes);
app.use('/shows', showRoutes);

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('Database connected');
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('DB connection failed:', err);
  });
