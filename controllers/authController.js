
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

        const checkExisting = () => {
            return new Promise((resolve, reject) => {
                const query = 'SELECT email, phoneNumber FROM User WHERE email = ? OR phoneNumber = ?';
                db.query(query, [email, phoneNumber], (error, results) => {
                    if (error) reject(error);
                    resolve(results);
                });
            });
        };

        const existingUsers = await checkExisting();

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

        const userCreationQuery = `INSERT INTO User (firstName, lastName, email, password, phoneNumber, gender) VALUES(?, ?, ?, ?, ?, ?)`
        const addressCreationQuery = "INSERT INTO Address (userId, street, city, state, postalCode, country) VALUES (?, ?, ?, ?, ?, ?)"

        db.query(userCreationQuery, [firstName, lastName, email, password, phoneNumber, gender], (error, result) => {
            if (error) {
                const error = new Error(error.sqlMessage)
                error.statusCode = 500
                throw error;
            }

            const userId = result.insertId;

            db.query(addressCreationQuery, [userId, street, city, state, postalCode, country], (error, result) => {
                if (error) {
                    const error = new Error(error.sqlMessage)
                    error.statusCode = 500
                    throw error;
                }

                const addressId = result.insertId;

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
                })
            })

        })
    } catch (error) {
        next(error)
    }
}


exports.login = async (req, res, next) => {
    const { email, password } = req.body
    const fetchUserQuery = "SELECT * FROM USER WHERE email = ?"

    try {

        const result = await new Promise((resolve, reject) => {
            db.query(fetchUserQuery, [email], (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        })

        if (result.length === 0) {
            const error = new Error("Email not found!");
            error.statusCode = 404;
            throw error;
        }

        const user = result[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            const error = new Error("Password doesn't match!");
            error.statusCode = 404;
            throw error;
        }

        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 6);

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                exp: Math.floor(expiryDate.getTime() / 1000)
            },
            process.env.JWT_SECRET
        );

        delete user.password;

        return res.status(201).json({
            Success: true,
            data: user,
            token
        });
    } catch (error) {
        next(error);
    }
}


exports.editUserInfo = async (req, res, next) => {
    try {
        const updatedUserData = req.body;

        if (Object.keys(updatedUserData).length > 0) {
            let fieldsToUpdateQuery = "";
            let fieldsToUpdateArray = [];

            Object.entries(updatedUserData).forEach(([key, value], index, array) => {
                fieldsToUpdateQuery += `${key}= ?${index === array.length - 1 ? "" : ","}`
                fieldsToUpdateArray.push(value)
            });

            const updateUserQuery = `UPDATE USER SET ` + fieldsToUpdateQuery + " WHERE id = ?"

            const result = await new Promise((resolve, reject) => {
                db.query(updateUserQuery, [...fieldsToUpdateArray, req.user.userId], (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                });
            })

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


exports.generateOtp = async (req, res, next) => {
    const { userId, email } = req.user;
    console.log(req.user);
    let otp = '';
    let otp_expiry_time = new Date(Date.now() + 60000);

    for (let i = 0; i < 4; i++) {
        otp += Math.floor(Math.random() * 10);
    }

    const updateUserOtpQuery = `UPDATE USER SET otp=?, otp_expiry=? WHERE id=?`;

    try {
        await new Promise((resolve, reject) => {
            db.query(updateUserOtpQuery, [otp, otp_expiry_time, userId], (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        })

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

    const userOtpQuery = `SELECT otp, otp_expiry FROM User WHERE id=?`;

    try {
        const results = await new Promise((resolve, reject) => {
            db.query(userOtpQuery, [userId], (error, results) => {
                if (error) reject(error);
                else resolve(results)
            })
        })

        const registeredOtp = results[0];
        const now = new Date();

        if (otp === registeredOtp.otp && now < new Date(registeredOtp.otp_expiry)) {

            const otpCleanupQuery = `UPDATE User SET otp=Null, otp_expiry=Null Where id=?`;

            await new Promise((resolve, reject) => {
                db.query(otpCleanupQuery, [userId], (error, results) => {
                    if (error) reject(error);
                    else resolve(results)
                })
            })

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
            const updateUserPasswordQuery = `UPDATE USER SET password=? WHERE id=?`;

            await new Promise((resolve, reject) => {
                db.query(updateUserPasswordQuery, [newPassword, userId], (error, results) => {
                    if (error) reject(error);
                    else resolve(results);
                })
            })

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
        const deleteUserQuery = `DELETE FROM USER WHERE id=?`;
        const deleteUserAddressQuery = `DELETE FROM ADDRESS WHERE userId=?`;

        await new Promise((resolve, reject) => {
            db.query(deleteUserAddressQuery, [userId], (error, results) => {
                if (error) reject(error);
                else resolve(results);
            })
        })

        await new Promise((resolve, reject) => {
            db.query(deleteUserQuery, [userId], (error, results) => {
                if (error) reject(error);
                else resolve(results);
            })
        })

        return res.status(201).json({
            Message: "User has been deleted!",
            Success: true
        })
    } catch (error) {
        next(error);
    }
} 