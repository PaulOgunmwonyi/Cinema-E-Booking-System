const { sequelize, Movie, Show, Genre } = require('../models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const movies = await Movie.findAll({
      include: [Genre, Show],
    });

    console.log(JSON.stringify(movies, null, 2));
  } catch (err) {
    console.error('DB connection failed:', err);
  }
})();
