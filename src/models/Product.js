const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');
const Category = require('./Category');

const Product = sequelize.define('Product', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  stockQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  origin: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  roastLevel: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  flavorNotes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },
});

Product.belongsTo(Category, { foreignKey: 'categoryId', onDelete: 'CASCADE' });
Category.hasMany(Product, { foreignKey: 'categoryId' });

module.exports = Product;
