const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');
const Product = require('./Product');

const CartItem = sequelize.define('CartItem', {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

CartItem.belongsTo(Product, { foreignKey: 'productId' });

module.exports = CartItem;
