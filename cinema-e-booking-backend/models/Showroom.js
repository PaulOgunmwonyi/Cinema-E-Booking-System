const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Showroom', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { 
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5000 }
    },
  }, {
    tableName: 'showrooms',
    timestamps: false,
    underscored: true,
  });
