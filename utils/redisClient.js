const redis = require('redis');

let redisClient;

// use a dynamic import to handle the top-level await
(async () => {
    try {
        redisClient = redis.createClient({
            url: 'test'
        });

        redisClient.on('error', (err) => console.error('Redis Client Error', err));
        await redisClient.connect();
        console.log('Connected to Redis');
    } catch (error) {
        console.error("Failed to connect to Redis:", error);
    }
})();

/**
 * Retrieves data from the Redis cache.
 * @param {string} key - The key to look up in the cache.
 * @returns {Promise<any>} - The cached data, or null if not found.
 */
const getFromCache = async (key) => {
    if (!redisClient) {
        console.log("Redis client not initialized, skipping cache read.");
        return null;
    }
    try {
        const cachedData = await redisClient.get(key);
        return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
        console.error(`Error retrieving data from cache for key ${key}:`, error);
        return null;
    }
};

/**
 * Stores data in the Redis cache.
 * @param {string} key - The key to store the data under.
 * @param {any} data - The data to store.  Must be serializable.
 * @param {number} [expirationSeconds] - Optional expiration time in seconds.
 * @returns {Promise<void>}
 */
const storeInCache = async (key, data, expirationSeconds) => {
    if (!redisClient) {
        console.log("Redis client not initialized, skipping cache store.");
        return;
    }
    try {
        const value = JSON.stringify(data);
        if (expirationSeconds) {
            await redisClient.set(key, value, { EX: expirationSeconds });
        } else {
            await redisClient.set(key, value);
        }
    } catch (error) {
        console.error(`Error storing data in cache for key ${key}:`, error);
    }
};

module.exports = {
    getFromCache,
    storeInCache,
    redisClient
};