const express = require("express");
const categoryController = require("../controllers/categoryController");
const verifyToken = require("../utils/verifyToken");
const multerMiddleware = require("../utils/multerMiddleware");

const upload = multerMiddleware("uploads/categories/");

const router = express.Router();

router.post("/createCategory", verifyToken, upload.single("image"), categoryController.createCategory);
router.get("/getCategories", verifyToken, categoryController.getCategories);
router.get("/getCategoryDetails", verifyToken, categoryController.getCategoryDetails);
router.post("/updateCategoryDetails", verifyToken, categoryController.updateCategoryDetails);
router.post("/deleteCategory", verifyToken, categoryController.deleteCategory);



module.exports = router