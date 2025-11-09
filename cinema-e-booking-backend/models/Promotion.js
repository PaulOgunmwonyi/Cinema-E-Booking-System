const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Promotion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: { 
      type: DataTypes.STRING(24),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    start_date: { type: DataTypes.DATE, allowNull: false },
    end_date:   { type: DataTypes.DATE, allowNull: false },
    discount_percent: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: false,
      validate: { min: 1, max: 100 }
    }
  }, {
    tableName: 'promotions',
    timestamps: true,
    underscored: true,
  });
