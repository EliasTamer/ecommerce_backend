const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../utils/databaseConnection");
const nodemailer = require('nodemailer');


exports.register = async (req, res, next) => {
    let { firstName, lastName, email, password, phoneNumber, street, city, state, postalCode, country, gender } = req.body;

    try {
        if (!firstName || !lastName || !email || !password || !phoneNumber || !street || !city || !state || !postalCode || !country || !gender) {
            const error = new Error("Please fill all the required fields")
            error.statusCode = 404;
            throw error
        }

        const query = 'SELECT email, phoneNumber FROM user WHERE email = ? OR phoneNumber = ?';
        const [existingUsers] = await db.query(query, [email, phoneNumber]);

        if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];
            if (existingUser.email === email) {
                const error = new Error("Email already exists");
                error.statusCode = 400;
                throw error;
            }
            if (existingUser.phoneNumber === phoneNumber) {
                const error = new Error("Phone number already exists");
                error.statusCode = 400;
                throw error;
            }
        }

        password = await bcrypt.hash(password, 12);

        const userCreationQuery = `INSERT INTO user (firstName, lastName, email, password, phoneNumber, gender) VALUES(?, ?, ?, ?, ?, ?)`;
        const [userResult] = await db.query(userCreationQuery, [firstName, lastName, email, password, phoneNumber, gender]);
        const userId = userResult.insertId;

        const addressCreationQuery = "INSERT INTO address (userId, street, city, state, postalCode, country) VALUES (?, ?, ?, ?, ?, ?)";
        const [addressResult] = await db.query(addressCreationQuery, [userId, street, city, state, postalCode, country]);
        const addressId = addressResult.insertId;

        return res.status(201).json({
            data: {
                id: userId,
                firstName,
                lastName,
                email,
                phoneNumber,
                gender,
                address: {
                    id: addressId,
                    street,
                    city,
                    state,
                    postalCode,
                    country
                }
            },
            Message: "User has been created!",
            Success: true
        });
    } catch (error) {
        next(error);
    }
}

exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    const fetchUserQuery = "SELECT * FROM user WHERE email = ?";

    try {
        const [rows] = await db.query(fetchUserQuery, [email]);

        if (rows.length === 0) {
            const error = new Error("Email not found!");
            error.statusCode = 404;
            throw error;
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            const error = new Error("Password doesn't match!");
            error.statusCode = 404;
            throw error;
        }

        const accessToken = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                exp: Math.floor(Date.now() / 1000) + (60 * 15)
            },
            process.env.JWT_SECRET
        );

        const refreshToken = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)
            },
            process.env.REFRESH_TOKEN_SECRET
        );

        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

        await db.query(
            'UPDATE user SET refresh_token = ?, refresh_token_expiry = ? WHERE id = ?',
            [refreshToken, refreshTokenExpiry, user.id]
        );

        delete user.password;
        delete user.refresh_token;
        delete user.refresh_token_expiry;

        return res.status(200).json({
            Success: true,
            data: user,
            accessToken,
            refreshToken
        });
    } catch (error) {
        next(error);
    }
}

exports.generateOtp = async (req, res, next) => {
    const { userId, email } = req.user;
    console.log(req.user);
    let otp = '';
    let otp_expiry_time = new Date(Date.now() + 60000);

    for (let i = 0; i < 4; i++) {
        otp += Math.floor(Math.random() * 10);
    }

    const updateUserOtpQuery = `UPDATE user SET otp=?, otp_expiry=? WHERE id=?`;

    try {
        await db.query(updateUserOtpQuery, [otp, otp_expiry_time, userId]);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            },
            secure: true,
            tls: {
                rejectUnauthorized: false
            }
        });

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP code is: ${otp}. This code will expire in 1 minute.`,
            html: `
            <h1>Your OTP Code</h1>
            <p>Your OTP code is: <strong>${otp}</strong></p>
            <p>This code will expire in 1 minute.</p>`
        });

        return res.status(201).json({
            Message: "Token has been generated successfuly!",
            Success: true,
        });
    } catch (error) {
        next(error)
    }
}

exports.validateOtp = async (req, res, next) => {
    const userId = req.user.userId;
    const { otp } = req.body;

    const userOtpQuery = `SELECT otp, otp_expiry FROM user WHERE id=?`;

    try {
        const [rows] = await db.query(userOtpQuery, [userId]);

        const registeredOtp = rows[0];
        const now = new Date();

        if (otp === registeredOtp.otp && now < new Date(registeredOtp.otp_expiry)) {
            const otpCleanupQuery = `UPDATE user SET otp=Null, otp_expiry=Null Where id=?`;
            await db.query(otpCleanupQuery, [userId]);

            return res.status(201).json({
                Message: "OTP validated successufly!",
                Success: true,
            })
        }
        else {
            let message = "";
            if (otp !== registeredOtp.otp) {
                message = "OTP doesn't match!"
            }
            else if (now > new Date(registeredOtp.otp_expiry)) {
                message = "OTP has expired!"
            }

            const error = new Error(message);
            throw error;
        }
    } catch (error) {
        next(error)
    }
}

exports.changePassword = async (req, res, next) => {
    const { userId } = req.user.userId;
    const { newPassword, confirmedNewPassword } = req.body;

    try {
        if (newPassword === confirmedNewPassword) {
            const updateUserPasswordQuery = `UPDATE user SET password=? WHERE id=?`;
            await db.query(updateUserPasswordQuery, [newPassword, userId]);

            return res.status(201).json({
                Message: "Password has been updated!",
                Success: true,
            })
        }
        else {
            const error = new Error("New password and confirmed password do not match!")
            error.statusCode = 404;
            throw error;
        }
    } catch (error) {
        next(error)
    }
}

exports.deleteUserAccount = async (req, res, next) => {
    const { userId } = req.user;

    try {
        const deleteUserQuery = `DELETE FROM user WHERE id=?`;
        const deleteUserAddressQuery = `DELETE FROM address WHERE userId=?`;

        await db.query(deleteUserAddressQuery, [userId]);
        await db.query(deleteUserQuery, [userId]);

        return res.status(201).json({
            Message: "User has been deleted!",
            Success: true
        })
    } catch (error) {
        next(error);
    }
}

exports.refreshToken = async (req, res, next) => {
    const { refreshToken } = req.body;

    try {
        if (!refreshToken) {
            const error = new Error("Refresh token is required");
            error.statusCode = 400;
            throw error;
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        const [rows] = await db.query(
            'SELECT * FROM user WHERE id = ? AND refresh_token = ?',
            [decoded.userId, refreshToken]
        );

        if (rows.length === 0) {
            const error = new Error("Invalid refresh token");
            error.statusCode = 401;
            throw error;
        }

        const user = rows[0];

        const newAccessToken = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                exp: Math.floor(Date.now() / 1000) + (60 * 15)
            },
            process.env.JWT_SECRET
        );

        return res.status(200).json({
            Success: true,
            accessToken: newAccessToken
        });
    } catch (error) {
        next(error);
    }
}