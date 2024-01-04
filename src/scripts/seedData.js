const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const Category = require('../models/Category');
const sequelize = require('../utils/database');
const Coupon = require('../models/Coupon');
require('dotenv').config();

const seedData = async () => {
  try {
    // Sync the database and force the creation of tables (reset existing tables)
    await sequelize.sync({ force: true });

    // Read data from the JSON file
    const dataPath = path.join(__dirname, '..', 'case_products.json');
    const rawData = fs.readFileSync(dataPath);
    const products = JSON.parse(rawData);

    // Group and add unique categories
    const uniqueCategories = [
      ...new Set(products.map((product) => product.category_title)),
    ];
    const categoryInstances = await Category.bulkCreate(
      uniqueCategories.map((title) => ({ title }))
    );

    // Map product data to include category_id and adjust property names
    const productsWithCategoryId = products.map((product) => {
      const category = categoryInstances.find(
        (c) => c.title === product.category_title
      );
      return {
        ...product,
        categoryId: category.id,
        stockQuantity: product.stock_quantity,
        flavorNotes: product.flavor_notes,
        roastLevel: product.roast_level,
      };
    });

    // Bulk insert data into the database
    await Product.bulkCreate(productsWithCategoryId);

    await Coupon.bulkCreate([
      {
        code: 'TTN2024TTT001',
        discountRate: 30,
      },
    ]);
    console.log('Seed data added to the database.');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
};

// Execute the seed data function
seedData();
