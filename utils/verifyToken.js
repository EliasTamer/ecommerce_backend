const jwt = require("jsonwebtoken")

module.exports = verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    try {
        if (!token) {
            const error = new Error("Access denied, invalid token!")
            error.statusCode = 404;
            throw error;
        }

        // it throws an error in case decodedUser is not valid
        const decodedUser = jwt.verify(token, process.env.JWT_SECRET);

        // attach the user info to the 
        req.user = decodedUser;
        next();

    } catch (error) {
        next(error)
    }
}