const express = require("express")
const authController = require("../controllers/authController")
const verifyToken = require("../utils/verifyToken")

const router = express.Router()


router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/editUserInfo", verifyToken, authController.editUserInfo);
router.get("/generateOtp", verifyToken, authController.generateOtp);
router.get("/validateOtp", verifyToken, authController.validateOtp);
router.post("/changePassword", verifyToken, authController.changePassword);
router.post("/deleteUserAccount", verifyToken, authController.deleteUserAccount);


module.exports = router