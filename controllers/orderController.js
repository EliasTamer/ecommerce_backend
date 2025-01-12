const db = require("../utils/databaseConnection");

exports.placeOrder = async (req, res, next) => {
    const { products } = req.body;
    const { userId } = req.user;

    try {
        // get all products in a single query
        const productIds = products.map(p => p.productId);
        const findProductsQuery = `SELECT * FROM PRODUCT WHERE id IN (?)`;
        const productsFound = await new Promise((resolve, reject) => {
            db.query(findProductsQuery, [productIds], (error, results) => {
                if (error) reject(error);
                resolve(results);
            });
        });

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
            UPDATE PRODUCT 
            SET stock = CASE id 
                ${products.map(p => `WHEN ${p.productId} THEN stock - ${p.quantity}`).join(' ')}
            END
            WHERE id IN (?)`;

        await new Promise((resolve, reject) => {
            db.query(updateStockQuery, [productIds], (error, results) => {
                if (error) reject(error);
                resolve(results);
            });
        });

        // Create order
        const totalAmount = products.reduce((acc, product) =>
            acc + (product.quantity * product.unit_price), 0);

        const createOrderQuery = `INSERT INTO \`ORDER\`(user_id, total_amount) VALUES (?, ?)`;
        const orderResult = await new Promise((resolve, reject) => {
            db.query(createOrderQuery, [userId, totalAmount], (error, results) => {
                if (error) reject(error);
                resolve(results);
            });
        });

        // bulk insert all order items in a single query
        const order_id = orderResult.insertId;
        const orderItemsQuery = `INSERT INTO ORDER_ITEM (order_id, product_id, quantity, unit_price) VALUES ?`;
        const orderItemValues = products.map(p => [order_id, p.productId, p.quantity, p.unit_price]);

        await new Promise((resolve, reject) => {
            db.query(orderItemsQuery, [orderItemValues], (error, results) => {
                if (error) reject(error);
                resolve(results);
            });
        });

        return res.status(201).json({
            message: "Order has been placed!",
            success: true
        });

    } catch (error) {
        next(error);
    }
}