const express = require('express');
require('dotenv').config();
const { errorHandler } = require('./middleware/errorHandler');
const bodyParser = require('body-parser');
const sequelize = require('./utils/database');

const app = express();

app.use(bodyParser.json());

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Start the application after syncing the database
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
    console.error('Error syncing the database:', error);
  });
