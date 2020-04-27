// exposes a variety of redis functions that have been wrapped in promises
// for use in async functions, particularly because returns are used for messages

const redis = require('redis');
const { promisify } = require('util'); // to turn redis operations into promises

const REDIS_URL = process.env.REDISCLOUD_URL || 'redis://127.0.0.1:6379';
const redisClient = redis.createClient(REDIS_URL);


// promisify redis functions to allow messages via event return values
const LRange = promisify(redisClient.LRANGE).bind(redisClient);
const LLen = promisify(redisClient.LLEN).bind(redisClient);
const LRem = promisify(redisClient.LREM).bind(redisClient);
const LPush = promisify(redisClient.LPUSH).bind(redisClient);

const HSet = promisify(redisClient.HSET).bind(redisClient);


module.exports = {
  LRange,
  LLen,
  LRem,
  LPush,
  HSet,
};