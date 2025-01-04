const db = require("../utils/databaseConnection");


exports.createCategory = async (req, res, next) => {
    const { name, description, image } = req.body;

    try {
        if (!name || !description || !image) {
            const error = new Error("name, description and image fields are required!");
            error.statusCode = 404;
            throw error;
        }

        const createCategoryQuery = `INSERT INTO CATEGORY(name, description, image) VALUES(?, ?, ?)`;
        const result = await new Promise((resolve, reject) => {
            db.query(createCategoryQuery, [name, description, image], (error, results) => {
                if (error) reject(error);
                resolve(results)
            })
        })

        return res.status(201).json({
            Success: true,
            Message: "Category has been created successfully!"
        })
    } catch (error) {
        next(error);
    }
}


exports.getCategories = async (req, res, next) => {
    try {
        const getCategoriesQuery = `SELECT * FROM CATEGORY;`
        const results = await new Promise((resolve, reject) => {
            db.query(getCategoriesQuery, [], (error, results) => {
                if (error) reject(error);
                resolve(results);
            })
        })

        return res.status(201).json({
            data: results,
            Success: true
        })
    } catch (error) {
        next(error);
    }
}


exports.getCategoryDetails = async (req, res, next) => {
    try {
        const { id } = req.body;
        const getCategoryDetailsQuery = `SELECT * FROM CATEGORY WHERE id=?`;
        const results = await new Promise((resolve, reject) => {
            db.query(getCategoryDetailsQuery, [id], (error, results) => {
                if (error) reject(error);
                resolve(results);
            })
        })

        return res.status(201).json({
            data: results[0] || {},
            Success: true
        })
    } catch (error) {
        next(error);
    }
}


exports.updateCategoryDetails = async (req, res, next) => {
    try {
        const updatedCategoryFields = req.body;

        if (Object.keys(updatedCategoryFields).length > 1) {
            let fieldsToUpdateQuery = "";
            let fieldsToUpdateArray = [];

            Object.entries(updatedCategoryFields).forEach(([key, value], index, array) => {
                fieldsToUpdateQuery += `${key}= ?${index === array.length - 1 ? "" : ","}`
                fieldsToUpdateArray.push(value)
            });

            const updateCategoryDetailsQuery = `UPDATE CATEGORY SET ` + fieldsToUpdateQuery + " WHERE id = ?"

            const result = await new Promise((resolve, reject) => {
                db.query(updateCategoryDetailsQuery, [...fieldsToUpdateArray, updatedCategoryFields.id], (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                });
            })

            return res.status(201).json({
                data: result,
                Success: true
            })
        } else {
            const errorMessage = !updatedCategoryFields.id ?
                "Please provide the category id that needs to be updated" :
                "Please provide at least one category field that needs to be updated!";
            const error = new Error(errorMessage);
            error.statusCode = 404;
            throw error;
        }
    } catch (error) {
        next(error);
    }
}


exports.deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.body;

        if (!id) {
            const error = new Error("Please provide the id of the category that you need to delete!");
            error.statusCode = 404;
            throw error;
        }

        const deleteCategoryQuery = `DELETE FROM CATEGORY WHERE id=?`;
        await new Promise((resolve, reject) => {
            db.query(deleteCategoryQuery, [id], (error, results) => {
                if (error) reject(error);
                resolve(results);
            })
        })

        return res.status(201).json({
            Message: "Category has been deleted!",
            Success: true
        })
    } catch (error) {
        next(error);
    }
}