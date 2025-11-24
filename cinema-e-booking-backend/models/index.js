require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false,
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.Movie = require('./Movie')(sequelize, Sequelize.DataTypes);
db.Genre = require('./Genre')(sequelize, Sequelize.DataTypes);
db.Show = require('./Show')(sequelize, Sequelize.DataTypes);
db.MovieGenre = require('./MovieGenre')(sequelize, Sequelize.DataTypes);
db.Showroom  = require('./Showroom')(sequelize, Sequelize.DataTypes);
db.Promotion = require('./Promotion')(sequelize, Sequelize.DataTypes);
db.User = require('./User')(sequelize, Sequelize.DataTypes);

// Associations
db.Movie.belongsToMany(db.Genre, { through: db.MovieGenre, foreignKey: 'movie_id' });
db.Genre.belongsToMany(db.Movie, { through: db.MovieGenre, foreignKey: 'genre_id' });
db.Movie.hasMany(db.Show, { foreignKey: 'movie_id' });
db.Show.belongsTo(db.Movie, { foreignKey: 'movie_id' });
db.Showroom.hasMany(db.Show, { foreignKey: 'showroom_id' });
db.Show.belongsTo(db.Showroom, { foreignKey: 'showroom_id' });

module.exports = db;
