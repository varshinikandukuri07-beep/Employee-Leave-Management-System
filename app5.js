
//To connect to database MYSQL, school table using db5.js
//app5.js
/*Execution:
Run
node app.js
Browser
http://localhost:3000/students
*/

const express = require("express");
const db = require("./db5");

const app = express();
app.get("/student", (req, res) => {

    db.query("SELECT * FROM student", (err, result) => {

        if(err)
            throw err;

        res.json(result);

    });
});

app.listen(4000, () => {

    console.log("Server Running");

});

