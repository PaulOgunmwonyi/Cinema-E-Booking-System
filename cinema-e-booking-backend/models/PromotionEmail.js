const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'PromotionEmail',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      promotion_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      user_email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      user_first_name: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('sent', 'failed'),
        allowNull: false,
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'promotion_emails',
      timestamps: false,
      underscored: true,
    }
  );
