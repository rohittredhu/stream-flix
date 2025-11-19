const { redisPubClient, redisSubClient } = require('../config/redis');

class PubSubService {
  async publish(channel, message) {
    try {
      await redisPubClient.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Publish error:', error);
      return false;
    }
  }

  async subscribe(channel, callback) {
    try {
      await redisSubClient.subscribe(channel, (message) => {
        try {
          callback(JSON.parse(message));
        } catch (error) {
          console.error('Callback error:', error);
        }
      });
      return true;
    } catch (error) {
      console.error('Subscribe error:', error);
      return false;
    }
  }

  async unsubscribe(channel) {
    try {
      await redisSubClient.unsubscribe(channel);
      return true;
    } catch (error) {
      console.error('Unsubscribe error:', error);
      return false;
    }
  }
}

module.exports = new PubSubService();