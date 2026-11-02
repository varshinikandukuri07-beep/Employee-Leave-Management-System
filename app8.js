
require("dotenv").config();
const express = require("express");
const mysql = require("mysql8");

const app = express();

app.use(express.json());
app.use(express.static("employee_public"));

// CONNECT TO EMPLOYEE DATABASE
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err.message);
        return;
    }

    console.log("Connected to Employee Database");
});

// GET ALL EMPLOYEE LEAVE RECORDS
app.get("/employees", (req, res) => {
    db.query("SELECT * FROM employee", (err, result) => {
        if (err) {
            res.status(500).send(err.message);
            return;
        }

        res.json(result);
    });
});

// GET ONE EMPLOYEE LEAVE RECORD
app.get("/employees/:id", (req, res) => {
    db.query(
        "SELECT * FROM employee WHERE Employee_id = ?",
        [req.params.id],
        (err, result) => {
            if (err) {
                res.status(500).send(err.message);
                return;
            }

            res.json(result);
        }
    );
});

// INSERT EMPLOYEE LEAVE RECORD
app.post("/employees", (req, res) => {
    const {
        Employee_id,
        name,
        department,
        type_of_leave,
        number_of_days,
        description
    } = req.body;

    const sql = `
        INSERT INTO employee
        (Employee_id, name, department, type_of_leave,
         number_of_days, description)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            Employee_id,
            name,
            department,
            type_of_leave,
            number_of_days,
            description
        ],
        (err) => {
            if (err) {
                res.status(500).send(err.message);
                return;
            }

            res.send("Employee Leave Record Added Successfully");
        }
    );
});

// UPDATE EMPLOYEE LEAVE RECORD
app.put("/employees/:id", (req, res) => {
    const {
        name,
        department,
        type_of_leave,
        number_of_days,
        description
    } = req.body;

    const sql = `
        UPDATE employee
        SET name = ?, department = ?, type_of_leave = ?,
            number_of_days = ?, description = ?
        WHERE Employee_id = ?
    `;

    db.query(
        sql,
        [
            name,
            department,
            type_of_leave,
            number_of_days,
            description,
            req.params.id
        ],
        (err, result) => {
            if (err) {
                res.status(500).send(err.message);
                return;
            }

            if (result.affectedRows === 0) {
                res.status(404).send("Employee Record Not Found");
            } else {
                res.send("Employee Leave Record Updated Successfully");
            }
        }
    );
});

// DELETE EMPLOYEE LEAVE RECORD
app.delete("/employees/:id", (req, res) => {
    db.query(
        "DELETE FROM employee WHERE Employee_id = ?",
        [req.params.id],
        (err, result) => {
            if (err) {
                res.status(500).send(err.message);
                return;
            }

            if (result.affectedRows === 0) {
                res.status(404).send("Employee Record Not Found");
            } else {
                res.send("Employee Leave Record Deleted Successfully");
            }
        }
    );
});

// START SERVER
app.listen(3001, () => {
    console.log("Server running at http://localhost:3001");
});