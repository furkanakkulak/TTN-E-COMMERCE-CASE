// Import necessary modules and configure environment variables
const express = require('express');
require('dotenv').config();
const { errorHandler } = require('./middleware/errorHandlerMiddleware');
const productRoutes = require('./routes/productRoutes');
const couponRoutes = require('./routes/couponRoutes');
const orderRoutes = require('./routes/orderRoutes');
const bodyParser = require('body-parser');
const sequelize = require('./utils/database');

// Create an Express application
const app = express();

// Middleware for parsing JSON requests
app.use(bodyParser.json());

// Route handling for product-related operations
app.use('/products', productRoutes);
app.use('/coupons', couponRoutes);
app.use('/orders', orderRoutes);

// Global error handler middleware to handle errors from routes
app.use(errorHandler);

// Define the port for the server
const PORT = process.env.PORT || 3000;

// Sync the database and start the server
sequelize
  .sync()
  .then(() => {
    console.log('Database synced.');
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    // Log an error if database sync fails
    console.error('Error syncing the database:', error);
  });
