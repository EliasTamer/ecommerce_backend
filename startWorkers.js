const orderProcessingQueue = require("./queues/orderProcessingQueue");
const db = require("./utils/databaseConnection");


orderProcessingQueue.process(async (job) => {
    const { products, userId } = job.data;
    console.log(`Processing order for user ${userId} with ${products.length} products`);

    try {
        // get all products in a single query
        const productIds = products.map(p => p.productId);
        const findProductsQuery = `SELECT * FROM product WHERE id IN (?)`;
        const [productsFound] = await db.query(findProductsQuery, [productIds]);

        const productMap = new Map(productsFound.map(p => [p.id, p]));

        // validate all products and stock in database
        products.forEach(product => {
            const dbProduct = productMap.get(product.productId);
            if (!dbProduct) {
                throw new Error(`Product id ${product.productId} doesn't exist!`);
            }
            if (dbProduct.stock < product.quantity) {
                throw new Error(`Product id ${product.productId} doesn't have the quantity requested in stock!`);
            }
        });

        // update all product stocks in a single query using CASE
        const updateStockQuery = `
        UPDATE product 
        SET stock = CASE id 
          ${products.map(p => `WHEN ${p.productId} THEN stock - ${p.quantity}`).join(' ')}
        END
        WHERE id IN (?)`;

        await db.query(updateStockQuery, [productIds]);

        // create order
        const totalAmount = products.reduce((acc, product) =>
            acc + (product.quantity * product.unit_price), 0);

        const createOrderQuery = `INSERT INTO \`order\`(user_id, total_amount) VALUES (?, ?)`;
        const [orderResult] = await db.query(createOrderQuery, [userId, totalAmount]);

        // bulk insert all order items in a single query
        const order_id = orderResult.insertId;
        const orderItemsQuery = `INSERT INTO order_item (order_id, product_id, quantity, unit_price) VALUES ?`;
        const orderItemValues = products.map(p => [order_id, p.productId, p.quantity, p.unit_price]);

        await db.query(orderItemsQuery, [orderItemValues]);

        return {
            success: true,
            message: "Order has been processed successfully!",
            orderId: order_id
        };
    } catch (error) {
        console.error('Order processing failed:', error);
        throw error;
    }
});

orderQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed! Order ${result.orderId} processed successfully`);
});

orderQueue.on('failed', (job, error) => {
    console.error(`Job ${job.id} failed with error: ${error.message}`);
});

console.log('Order processing worker is running');