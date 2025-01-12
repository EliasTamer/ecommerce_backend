const express = require("express");
const verifyToken = require("../utils/verifyToken");
const orderController = require("../controllers/orderController");

const router = express.Router();


router.post("/placeOrder", verifyToken, orderController.placeOrder);


module.exports = router;