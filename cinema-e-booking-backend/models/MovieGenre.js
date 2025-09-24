const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('MovieGenre', {
    movie_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    genre_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'movie_genres_map',
    timestamps: false,
  });
