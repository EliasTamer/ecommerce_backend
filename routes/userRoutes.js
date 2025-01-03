const express = require("express");
const verifyToken = require("../utils/verifyToken");
const userController = require("../controllers/userController");

const router = express.Router();


router.get("/profile", verifyToken, userController.getProfile);
router.post("/profile", verifyToken, userController.editProfile);


module.exports = router;