const express = require("express");
const verifyToken = require("../utils/verifyToken");
const productController = require("../controllers/productController");

const router = express.Router();


router.post("/createProduct", verifyToken, productController.createProduct);


module.exports = router;