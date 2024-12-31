const fs = require('fs');
const path = require('path');

const db = require("../utils/databaseConnection");
const saveToStorageAccount = require("../utils/saveToStorageAccount");

exports.createProduct = async (req, res, next) => {
    try {
        const { name, description, price, stock } = req.body;

        const testImage = {
            fieldname: 'image',
            originalname: 'ps5.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            buffer: fs.readFileSync('ps5.jpg'),
            size: fs.statSync('ps5.jpg').size
        };

        const imageUrl = await saveToStorageAccount(testImage, 'products');

        const createProductQuery = "INSERT INTO PRODUCT (name, description, price, stock, image) VALUES(?, ?, ?, ?, ?)";

        const result = await new Promise((resolve, reject) => {
            db.query(createProductQuery, [name, description, price, stock, imageUrl], (error, result) => {
                if (error) reject(error);
                else resolve(result);
            })
        });

        return res.status(201).json({
            data: {
                productId: result.insertId
            },
            Message: "Product has been added successfuly!",
            Success: true
        })
    } catch (error) {
        next(error);
    }
}