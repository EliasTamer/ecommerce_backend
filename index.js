require("dotenv").config();
const express = require("express")
const app = express();
const mysql = require("mysql2")
const authRoutes = require("./routes/authRoutes")

const port = process.env.PORT || 3001

// formatting body requests to json
app.use(express.json());

// to enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
})

app.use("/api/auth", authRoutes)

// to handle the thrown errors in my controllers
app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;

    res.status(status).json({
        Message: message,
        Success: false
    });
});


app.listen(port, (error) => {
    if (error) {
        console.error('Error starting server:', error);
        return;
    }
    console.log(`Server is running on port ${port}`);
});