const orderProcessingQueue = require('../queues/orderProcessingQueue');

exports.placeOrder = async (req, res, next) => {
    const { products } = req.body;
    const { userId } = req.user;

    try {
        const job = await orderProcessingQueue.add({
            products,
            userId
        }, {
            attempts: 3, // number of retry attempts if job fails
            backoff: {
                type: 'exponential',
                delay: 2000 // initial delay before retry in ms
            },
            removeOnComplete: true,
            removeOnFail: false
        });

        return res.status(202).json({
            message: "Your order has been queued for processing!",
            jobId: job.id,
            success: true
        });
    } catch (error) {
        console.error('Failed to queue order:', error);
        next(error);
    }
};