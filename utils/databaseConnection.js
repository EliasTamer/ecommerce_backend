const mysql = require("mysql2")


const connection = mysql.createConnection({
    database:process.env.DB_NAME,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    user: process.env.DB_USER
})

connection.connect(err => {
    if(err){
        console.log("Error connecting to MYSQL database", err.stack)
        return;
    } 
    console.log("MYSQL connection has been establish successfuly!")
})

module.exports = connection