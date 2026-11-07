/*(e) Write a program to establish the connection between API and Database using Express – MySQL Driver
Install MySQL Driver

>npm install mysql8
________________________________________
Save the following program with name db5.js
*/
const mysql = require("mysql8");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "school"
});

connection.connect((err) => {
    if(err){
        console.log(err);
    }
    else{
        console.log("Hi Prem! Connected to MySQL - School database");
    }
});

module.exports = connection;

