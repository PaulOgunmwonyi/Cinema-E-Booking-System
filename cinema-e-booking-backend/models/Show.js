const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Show', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    movie_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'shows',
    timestamps: false,
  });
