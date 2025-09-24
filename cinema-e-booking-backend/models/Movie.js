// models/Movie.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Movie', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    synopsis: {   // ✅ matches your table
      type: DataTypes.TEXT,
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
    },
    mpaa_rating: {
      type: DataTypes.STRING,
    },
    release_date: {
      type: DataTypes.DATE,
    },
    director: {
      type: DataTypes.STRING,
    },
    producer: {
      type: DataTypes.STRING,
    },
    poster_url: {
      type: DataTypes.STRING,
    },
    trailer_url: {
      type: DataTypes.STRING,
    },
  }, {
    tableName: 'movies',
    timestamps: true,
    underscored: true,
  });

