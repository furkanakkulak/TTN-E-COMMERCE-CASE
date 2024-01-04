const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.simple(),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.printf((info) => {
      return `${info.level.toUpperCase()} ${info.timestamp} - ${info.message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
