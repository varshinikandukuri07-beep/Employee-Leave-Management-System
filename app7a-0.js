const express = require("express");
const mysql = require("mysql8");

const app = express();

app.use(express.json());

// Read HTML files from public folder
app.use(express.static("public"));


// Connection with school database
const db = mysql.createConnection({

    host: "localhost",
    user: "root",
    password: "pandu",
    database: "school"

});

db.connect((err) => {

    if (err)
        throw err;

    console.log("Connected to MySQL");

});


// GET ALL STUDENTS
app.get("/students", (req, res) => {

    db.query(
        "SELECT * FROM student",
        (err, result) => {

            if (err)
                throw err;

            res.json(result);

        });

});


// GET ONE STUDENT
app.get("/students/:id", (req, res) => {

    db.query(
        "SELECT * FROM student WHERE std_id=?",
        [req.params.id],
        (err, result) => {

            if (err)
                throw err;

            res.json(result);

        });

});


// INSERT STUDENT
app.post("/students", (req, res) => {

    const { std_id, stud_name, age, mobile, total } = req.body;

    db.query(
        "INSERT INTO student (std_id, stud_name, age, mobile, total) VALUES (?, ?, ?, ?, ?)",
        [std_id, stud_name, age, mobile, total],
        (err) => {

            if (err) {
                res.status(500).send(err.message);
                return;
            }

            res.send("Student Inserted");

        }
    );

});


// UPDATE STUDENT
app.put("/students/:id", (req, res) => {

    const { stud_name, age, mobile, total } = req.body;

    db.query(
        "UPDATE student SET stud_name=?, age=?, mobile=?, total=? WHERE std_id=?",
        [stud_name, age, mobile, total, req.params.id],
        (err, result) => {

            if (err) {
                res.status(500).send(err.message);
                return;
            }

            if (result.affectedRows == 0)
                res.status(404).send("Student NOT found");
            else
                res.send("Student Updated");

        });

});


// DELETE STUDENT
app.delete("/students/:id", (req, res) => {

    db.query(
        "DELETE FROM student WHERE std_id=?",
        [req.params.id],
        (err, result) => {

            if (err) {
                res.status(500).send(err.message);
                return;
            }

            if (result.affectedRows == 0)
                res.status(404).send("Student NOT found to delete");
            else
                res.send("Student Deleted");

        });

});


// START SERVER
app.listen(3000, () => {

    console.log("Server running at http://localhost:3000");

});