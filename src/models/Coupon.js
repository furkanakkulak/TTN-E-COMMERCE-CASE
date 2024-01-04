const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Coupon = sequelize.define('Coupon', {
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
});

module.exports = Coupon;
