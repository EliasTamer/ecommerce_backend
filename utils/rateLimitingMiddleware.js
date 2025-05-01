function rateLimitingMiddleware(options = {}) {
    const {
        windowMs = 60 * 1000, // default time window: 1 minute in milliseconds
        max = 2,            // default max requests allowed in the window
        message = 'Too many requests, please try again later.', 
        statusCode = 429,
    } = options;

    const store = new Map();

    // this interval runs every windowMs and removes expired entries
    const interval = setInterval(() => {
        const now = Date.now();

        for (const [key, data] of store.entries()) {
            if (now - data.timestamp > windowMs) {
                store.delete(key);
            }
        }
    }, windowMs);

    // this ensures the server can shut down properly even if the interval is running
    interval.unref();

    return function rateLimiterMiddleware(req, res, next) {
        const key = req.ip;
        const now = Date.now();

        if (!store.has(key)) {
            store.set(key, {
                count: 1,
                timestamp: now
            });
            return next();
        }

        const data = store.get(key);

        if (now - data.timestamp > windowMs) {
            data.count = 1;
            data.timestamp = now;
            return next();
        }

        data.count++;

        if (data.count > max) {
            return res.status(statusCode).send(message);
        }

        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - data.count)); 
        res.setHeader('X-RateLimit-Reset', Math.ceil((data.timestamp + windowMs) / 1000));

        next();
    };
}

module.exports = rateLimitingMiddleware