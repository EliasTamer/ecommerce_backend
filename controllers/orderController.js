const db = require("../utils/databaseConnection");

exports.placeOrder = async (req, res, next) => {
    const { products } = req.body;
    const { userId } = req.user;

    try {
        const totalAmount = products.reduce((acc, product) => {
            return acc + (product.quantity * product.unit_price)
        }, 0);

        const createOrderQuery = `INSERT INTO \`ORDER\`(user_id, total_amount) VALUES (?, ?)`;

        const results = await new Promise((resolve, reject) => {
            db.query(createOrderQuery, [userId, totalAmount], (error, results) => {
                if (error) reject(error);
                resolve(results);
            })
        });

        const order_id = results.insertId;

        products.forEach(async product => {
            const { productId, quantity, unit_price } = product;
            const createOrderItemQuery = `INSERT INTO ORDER_ITEM (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`;

            const results = await new Promise((resolve, reject) => {
                db.query(createOrderItemQuery, [order_id, productId, quantity, unit_price], (error, results) => {
                    if (error) reject(error);
                    resolve(results);
                })
            });
        });

        return res.status(201).json({
            Message: "Order has been placed!",
            Success: true
        })
    } catch (error) {
        next(error);
    }
}