const db = require("../utils/databaseConnection");
const saveToStorageAccount = require("../utils/saveToStorageAccount");
const { getFromCache, storeInCache } = require('../utils/redisClient');

exports.createProduct = async (req, res, next) => {
    try {
        const { name, description, price, stock, categoryId } = req.body;

        if (!req.file) {
            const error = new Error("No image file provided");
            error.statusCode = 400;
            throw error;
        }

        // upload to Azure Storage and get URL
        const imageUrl = await saveToStorageAccount(req.file, 'products');

        const createProductQuery = "INSERT INTO product (name, description, price, stock, image, category_id) VALUES(?, ?, ?, ?, ?, ?)";
        const [result] = await db.query(createProductQuery, [name, description, price, stock, imageUrl, categoryId]);

        return res.status(201).json({
            data: {
                id: result.insertId,
                ...req.body,
                image: imageUrl
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
        const filters = req.body;

        let getProductsQuery = 'SELECT * FROM product';
        const queryParams = [];

        if (filters && Object.keys(filters).length > 0) {
            getProductsQuery += ' WHERE';

            Object.entries(filters).forEach(([key, value], index) => {
                if (index > 0) {
                    getProductsQuery += ' AND';
                }

                getProductsQuery += ` ${key} = ?`;
                queryParams.push(value);
            });
        }

        const [results] = await db.query(getProductsQuery, queryParams);

        return res.status(201).json({
            data: results,
            Success: true,
        });
    }
    catch (error) {
        next(error);
    }
};

exports.getProductDetails = async (req, res, next) => {
    const { productId } = req.body;
    const cacheKey = `product:${productId}`;
    const cacheExpiration = 10;

    try {
        const cachedProduct = await getFromCache(cacheKey);
        if (cachedProduct) {
            console.log(`Product details found in cache for ID ${productId}`);
            return res.status(200).json({
                data: cachedProduct,
                Success: true,
            });
        }

        const getProductDetailsQuery = `SELECT * FROM product WHERE id=?`;
        const [results] = await db.query(getProductDetailsQuery, [productId]);

        if (results.length === 0) {
            const error = new Error("No product found!");
            error.statusCode = 404;
            throw error;
        }

        const productData = results[0];

        await storeInCache(cacheKey, productData, cacheExpiration);
        console.log(`Product details for ID ${productId} stored in cache`);

        return res.status(200).json({
            data: productData,
            Success: true,
        });
    } catch (error) {
        next(error);
    }
};

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

            const updatedProductQuery = `UPDATE product SET ` + fieldsToUpdateQuery + " WHERE id = ?";
            const [result] = await db.query(updatedProductQuery, [...fieldsToUpdateArray, updatedProductDetails.id]);

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
        const deleteProductQuery = `DELETE FROM product WHERE id=?`;
        const [results] = await db.query(deleteProductQuery, [id]);

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