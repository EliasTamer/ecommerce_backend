const Queue = require("bull");

const orderProcessingQueue = new Queue("order-processing", {
    redis: {
        port: 6379,
        host: "127.0.0.1"
    }
})

module.exports = orderProcessingQueue