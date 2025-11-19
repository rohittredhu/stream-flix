const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

const redisPubClient = redis.createClient({
  url: process.env.REDIS_URL
});

const redisSubClient = redis.createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisPubClient.on('error', (err) => console.error('Redis Pub Error:', err));
redisSubClient.on('error', (err) => console.error('Redis Sub Error:', err));

redisClient.on('connect', () => console.log('✅ Redis Client Connected'));
redisPubClient.on('connect', () => console.log('✅ Redis Pub Client Connected'));
redisSubClient.on('connect', () => console.log('✅ Redis Sub Client Connected'));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    await redisPubClient.connect();
    await redisSubClient.connect();
    console.log('✅ All Redis clients connected successfully');
  } catch (error) {
    console.error('❌ Redis connection error:', error);
    throw error;
  }
};

module.exports = { redisClient, redisPubClient, redisSubClient, connectRedis };