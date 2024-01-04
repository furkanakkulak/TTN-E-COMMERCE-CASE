// Import necessary modules and configure environment variables
const express = require('express');
require('dotenv').config();
const { errorHandler } = require('./middleware/errorHandlerMiddleware');
const productRoutes = require('./routes/productRoutes');
const couponRoutes = require('./routes/couponRoutes');
const orderRoutes = require('./routes/orderRoutes');
const bodyParser = require('body-parser');
const sequelize = require('./utils/database');
const { redisClient } = require('./utils/redis');
const expressWinston = require('express-winston');
const logger = require('./pkg/logger');

// Create an Express application
const app = express();

// Middleware for parsing JSON requests
app.use(bodyParser.json());
app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: false,
    msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}}',
    expressFormat: true,
    colorize: true,
  })
);

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
    logger.info('Database synced.');
    // Start the server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    // Log an error if database sync fails
    logger.error('Error syncing the database:', error);
  });

// Handle Redis errors
redisClient.on('error', (err) => {
  logger.error('Redis error:', err);
});
