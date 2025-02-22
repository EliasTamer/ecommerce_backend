const fs = require('fs');
const path = require('path');

const db = require("../utils/databaseConnection");
const saveToStorageAccount = require("../utils/saveToStorageAccount");

exports.createProduct = async (req, res, next) => {
    try {
        const { name, description, price, stock, categoryId } = req.body;

        const imagePath = path.join('images', 'ps5.jpg');
        const testImage = {
            fieldname: 'image',
            originalname: 'ps5.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            buffer: fs.readFileSync(imagePath),
            size: fs.statSync(imagePath).size
        };

        const imageUrl = await saveToStorageAccount(testImage, 'products');

        const createProductQuery = "INSERT INTO PRODUCT (name, description, price, stock, image, category_id) VALUES(?, ?, ?, ?, ?, ?)";

        const result = await new Promise((resolve, reject) => {
            db.query(createProductQuery, [name, description, price, stock, imageUrl, categoryId], (error, result) => {
                if (error) reject(error);
                else resolve(result);
            })
        });

        return res.status(201).json({
            data: {
                id: result.insertId,
                ...req.body
            },
            Message: "Product has been added successfuly!",
            Success: true
        })
    } catch (error) {
        next(error);
    }
}


exports.getProducts = async (req, res, next) => {
    try {
        const getProductsQuery = `SELECT * FROM PRODUCT`;
        const results = await new Promise((resolve, reject) => {
            db.query(getProductsQuery, [], (error, results) => {
                if (error) reject(error);
                resolve(results)
            })
        })

        return res.status(201).json({
            data: results,
            Success: true,
        })
    }
    catch (error) {
        next(error);
    }
}


exports.getProductDetails = async (req, res, next) => {
    const { productId } = req.body;

    try {
        const getProductDetailsQuery = `SELECT * FROM PRODUCT WHERE id=?`;
        const results = await new Promise((resolve, reject) => {
            db.query(getProductDetailsQuery, [productId], (error, results) => {
                if (error) reject(error);
                resolve(results);
            })
        })

        if (results.length === 0) {
            const error = new Error("No product found!");
            error.statusCode = 404;
            throw error;
        }

        return res.status(201).json({
            data: results[0],
            Success: true
        })
    } catch (error) {
        next(error);
    }
}


exports.updateProduct = async (req, res, next) => {
    try {
        const updatedProductDetails = req.body;

        if (Object.keys(updatedProductDetails).length > 1) {
            let fieldsToUpdateQuery = "";
            let fieldsToUpdateArray = [];

            Object.entries(updatedProductDetails).forEach(([key, value], index, array) => {
                fieldsToUpdateQuery += `${key}= ?${index === array.length - 1 ? "" : ","}`
                fieldsToUpdateArray.push(value)
            });

            const updatedProductQuery = `UPDATE PRODUCT SET ` + fieldsToUpdateQuery + " WHERE id = ?";

            const result = await new Promise((resolve, reject) => {
                db.query(updatedProductQuery, [...fieldsToUpdateArray, updatedProductDetails.id], (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                });
            })

            return res.status(201).json({
                data: result,
                Success: true
            })
        } else {
            const errorMessage = !updatedProductDetails.id ?
                "Please provide the product id that needs to be updated" :
                "Please provide at least one product field that needs to be updated!";
            const error = new Error(errorMessage);
            error.statusCode = 404;
            throw error;
        }
    } catch (error) {
        next(error);
    }
}


exports.deleteProduct = async (req, res, next) => {
    const { id } = req.body;

    try {
        const deleteProductQuery = `DELETE FROM PRODUCT WHERE id=?`;
        const results = await new Promise((resolve, reject) => {
            db.query(deleteProductQuery, [id], (error, results) => {
                if (error) reject(error);
                resolve(results);
            })
        })

        if (results.affectedRows === 0) {
            const error = new Error("Please provide a valid id of the product that you want to delete!");
            error.statusCode = 404;
            throw error;
        }

        return res.status(201).json({
            data: results,
            Message: "Product has been deleted successfully!",
            Success: true
        })
    } catch (error) {
        next(error);
    }
}