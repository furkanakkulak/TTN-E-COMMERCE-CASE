// Define a generic error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Set default status code and message
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Override status code and message if provided in the error object
  if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Respond with the appropriate status code and error message
  res.status(statusCode).json({ error: message });
};

module.exports = { errorHandler };
