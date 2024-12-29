const fs = require('fs');
const path = require('path');

const db = require("../utils/databaseConnection");
const saveToStorageAccount = require("../utils/saveToStorageAccount");

exports.createProduct = async (req, res, next) => {
    try {
        const { name, description, price, stock } = req.body;

        // First verify the connection string is available
        console.log('Connection string exists:', !!process.env.AZURE_STORAGE_CONNECTION_STRING);

        const testFile = {
            fieldname: 'image',
            originalname: 'ps5.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            buffer: fs.readFileSync('ps5.jpg'),
            size: fs.statSync('ps5.jpg').size
        };

        const imageUrl = await saveToStorageAccount(testFile, 'products');
        console.log('Upload successful:', imageUrl);

        res.status(200).json({ success: true, imageUrl });
    } catch (error) {
        console.error('Controller error:', error);
        next(error);
    }
}