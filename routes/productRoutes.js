const express = require("express");
const verifyToken = require("../utils/verifyToken");
const productController = require("../controllers/productController");

const router = express.Router();


router.post("/createProduct", verifyToken, productController.createProduct);
router.get("/getProducts", verifyToken, productController.getProducts);
router.get("/getProductDetails", verifyToken, productController.getProductDetails);
router.post("/updateProduct", verifyToken, productController.updateProduct);
router.post("/deleteProduct", verifyToken, productController.deleteProduct);

module.exports = router;