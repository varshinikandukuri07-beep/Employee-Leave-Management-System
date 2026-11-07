
// To perform CRUD operations on students table of school database
// MySQL table columns:
// stud_id, stud_name, class, total

// Install:
// npm install mysql8

// Run:
// node app6.js

const express = require("express");
const mysql = require("mysql8");

const app = express();

// Read JSON data from Postman
app.use(express.json());


// =====================================
// MySQL CONNECTION
// =====================================

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "pandu",
    database: "school"
});

db.connect((err) => {
    if (err)
        throw err;

    console.log("Prem! Connected to MySQL Database");
});


// =====================================
// READ ALL STUDENTS
// =====================================

app.get("/students", (req, res) => {

    db.query("SELECT * FROM student", (err, result) => {

        if (err)
            throw err;

        res.json(result);

    });

});


// =====================================
// READ ONE STUDENT
// =====================================

app.get("/students/:id", (req, res) => {

    db.query(
        "SELECT * FROM student WHERE std_id=?",
        [req.params.id],
        (err, result) => {

            if (err)
                throw err;

            res.json(result);

        }
    );

});




// =====================================
// INSERT STUDENT
// =====================================
app.post("/students", (req, res) => {

    const { std_id, stud_name, class: studentClass, total } = req.body;

    db.query(
        "INSERT INTO student (std_id, stud_name, class, total) VALUES (?, ?, ?, ?)",
        [std_id, stud_name, studentClass, total],
        (err) => {

            if (err)
                throw err;

            res.send("Student Inserted Successfully");
        }
    );

});
// =====================================
// UPDATE STUDENT TOTAL
// =====================================

app.put("/students/:id", (req, res) => {

    const { total } = req.body;

    db.query(
        "UPDATE student SET total=? WHERE std_id=?",
        [total, req.params.id],
        (err, result) => {

            if (err)
                throw err;

            if (result.affectedRows == 0)
                res.send("Student Not Found");
            else
                res.send("Student Updated Successfully");

        }
    );

});


// =====================================
// DELETE STUDENT
// =====================================

app.delete("/students/:id", (req, res) => {

    db.query(
        "DELETE FROM student WHERE std_id=?",
        [req.params.id],
        (err, result) => {

            if (err)
                throw err;

            if (result.affectedRows == 0)
                res.send("Student Not Found");
            else
                res.send("Student Deleted Successfully");

        }
    );

});


// =====================================
// START SERVER
// =====================================

app.listen(3000, () => {

    console.log("Server Running at http://localhost:3000");

});