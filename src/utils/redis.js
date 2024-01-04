const redis = require('ioredis');
const { promisify } = require('util');
const dotenv = require('dotenv');
dotenv.config();

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;

const redisClient = new redis({
  host: redisHost,
  port: redisPort,
});

const getAsync = promisify(redisClient.get).bind(redisClient);

module.exports = { redisClient, getAsync };
