const db = require("../utils/databaseConnection");

exports.placeOrder = async (req, res, next) => {
    const { products } = req.body;
    const { userId } = req.user;

    try {
        // get all products in a single query
        const productIds = products.map(p => p.productId);
        const findProductsQuery = `SELECT * FROM product WHERE id IN (?)`;
        const [productsFound] = await db.query(findProductsQuery, [productIds]);

        // Create a map for easier lookup and validation
        const productMap = new Map(productsFound.map(p => [p.id, p]));

        // validate all products and stock in database
        products.forEach(product => {
            const dbProduct = productMap.get(product.productId);
            if (!dbProduct) {
                const error = new Error(`Product id ${product.productId} doesn't exist!`);
                error.statusCode = 404;
                throw error;
            }
            if (dbProduct.stock < product.quantity) {
                const error = new Error(`Product id ${product.productId} doesn't have the quantity requested in stock!`);
                error.statusCode = 400;
                throw error;
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

        // Create order
        const totalAmount = products.reduce((acc, product) =>
            acc + (product.quantity * product.unit_price), 0);

        const createOrderQuery = `INSERT INTO \`order\`(user_id, total_amount) VALUES (?, ?)`;
        const [orderResult] = await db.query(createOrderQuery, [userId, totalAmount]);

        // bulk insert all order items in a single query
        const order_id = orderResult.insertId;
        const orderItemsQuery = `INSERT INTO order_item (order_id, product_id, quantity, unit_price) VALUES ?`;
        const orderItemValues = products.map(p => [order_id, p.productId, p.quantity, p.unit_price]);

        await db.query(orderItemsQuery, [orderItemValues]);

        return res.status(201).json({
            message: "Order has been placed!",
            success: true
        });

    } catch (error) {
        next(error);
    }
}