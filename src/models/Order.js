const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');
const Coupon = require('./Coupon');
const CartItem = require('./CartItem');

const Order = sequelize.define('Order', {
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  shippingFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  discountRate: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  netAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
});

Order.hasMany(CartItem, { foreignKey: 'orderId', onDelete: 'CASCADE' });
Order.belongsTo(Coupon, { foreignKey: 'couponId' });

module.exports = Order;
