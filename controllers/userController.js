const db = require("../utils/databaseConnection");

exports.getProfile = async (req, res, next) => {
    const { userId } = req.body;

    try {
        const getUserProfileQuery = `SELECT * FROM user WHERE id=?`;
        const [results] = await db.query(getUserProfileQuery, [userId]);

        if (results.length === 1) {
            const userData = results[0];
            delete userData.password;
            delete userData.otp;
            delete userData.otp_expiry;
            return res.status(201).json({
                data: userData,
                Success: true
            })
        } else {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }
    } catch (error) {
        next(error);
    }
}


exports.editProfile = async (req, res, next) => {
    try {
        const updatedUserData = req.body;

        if (Object.keys(updatedUserData).length > 0) {
            let fieldsToUpdateQuery = "";
            let fieldsToUpdateArray = [];

            Object.entries(updatedUserData).forEach(([key, value], index, array) => {
                fieldsToUpdateQuery += `${key}= ?${index === array.length - 1 ? "" : ","}`
                fieldsToUpdateArray.push(value)
            });

            const updateUserQuery = `UPDATE user SET ` + fieldsToUpdateQuery + " WHERE id = ?";
            const [result] = await db.query(updateUserQuery, [...fieldsToUpdateArray, req.user.userId]);

            return res.status(201).json({
                data: result,
                Success: true
            })
        } else {
            const error = new Error("Please provide the user fields that need to be updated!");
            error.statusCode = 404;
            throw error;
        }
    } catch (error) {
        next(error)
    }
}