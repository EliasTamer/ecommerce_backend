const express = require("express");
const verifyToken = require("../utils/verifyToken");
const productController = require("../controllers/productController");
const multerMiddleware = require("../utils/multerMiddleware");

const router = express.Router();

const upload = multerMiddleware("uploads/products/");


router.post("/createProduct", verifyToken, upload.single("image"), productController.createProduct);
router.get("/getProducts", productController.getProducts);
router.get("/getProductDetails", verifyToken, productController.getProductDetails);
router.post("/updateProduct", verifyToken, productController.updateProduct);
router.post("/deleteProduct", verifyToken, productController.deleteProduct);

module.exports = router;