
require("dotenv").config();

const express = require("express");
const mysql = require("mysql8");
const path = require("path");

const app = express();
const PORT = 3009;

// ========================================
// MIDDLEWARE
// ========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    express.static(path.join(__dirname, "college-placement_public"))
);

// ========================================
// MYSQL CONNECTION
// ========================================
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "pandu",
    database: "college_placement"
});

db.connect((err) => {
    if (err) {
        console.error("Database connection error:", err.message);
        return;
    }

    console.log("Connected to college_placement database!");
});

// ========================================
// HOME PAGE
// ========================================
app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "college-placement_public", "index.html")
    );
});

// ========================================
// DASHBOARD STATISTICS
// ========================================
app.get("/dashboard/stats", (req, res) => {
    const sql = `
        SELECT
            (SELECT COUNT(*) FROM students) AS students,
            (SELECT COUNT(*) FROM companies) AS companies,
            (SELECT COUNT(*) FROM applications) AS applications
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Dashboard error:", err.message);
            return res.status(500).json({ error: err.message });
        }

        res.json(results[0]);
    });
});

// ========================================
// STUDENTS: GET ALL
// ========================================
app.get("/students", (req, res) => {
    db.query(
        "SELECT * FROM students ORDER BY student_id DESC",
        (err, results) => {
            if (err) {
                console.error("Get students error:", err.message);
                return res.status(500).json({ error: err.message });
            }

            res.json(results);
        }
    );
});

// ========================================
// STUDENTS: GET ONE
// ========================================
app.get("/students/:id", (req, res) => {
    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({ error: "Invalid student ID." });
    }

    db.query(
        "SELECT * FROM students WHERE student_id = ?",
        [studentId],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: "Student not found." });
            }

            res.json(results[0]);
        }
    );
});

// ========================================
// STUDENTS: REGISTER
// ========================================
app.post("/students", (req, res) => {
    const {
        student_id,
        name,
        roll_no,
        branch,
        cgpa,
        email
    } = req.body;

    if (
        student_id === undefined ||
        !name?.trim() ||
        !roll_no?.trim() ||
        !branch?.trim() ||
        cgpa === undefined ||
        cgpa === "" ||
        !email?.trim()
    ) {
        return res.status(400).json({
            error: "Please provide all required student details."
        });
    }

    const id = Number(student_id);
    const studentCgpa = Number(cgpa);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: "Student ID must be a positive integer."
        });
    }

    if (
        !Number.isFinite(studentCgpa) ||
        studentCgpa < 0 ||
        studentCgpa > 10
    ) {
        return res.status(400).json({
            error: "CGPA must be between 0 and 10."
        });
    }

    const sql = `
        INSERT INTO students
        (student_id, name, roll_no, branch, cgpa, email)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        id,
        name.trim(),
        roll_no.trim(),
        branch.trim(),
        studentCgpa,
        email.trim()
    ];

    db.query(sql, values, (err) => {
        if (err) {
            console.error("Student registration error:", err.message);
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
            message: "Student registered successfully!",
            student_id: id
        });
    });
});

// ========================================
// STUDENTS: UPDATE
// ========================================
app.put("/students/:id", (req, res) => {
    const studentId = Number(req.params.id);

    const {
        name,
        roll_no,
        branch,
        cgpa,
        email
    } = req.body;

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({ error: "Invalid student ID." });
    }

    if (
        !name?.trim() ||
        !roll_no?.trim() ||
        !branch?.trim() ||
        cgpa === undefined ||
        cgpa === "" ||
        !email?.trim()
    ) {
        return res.status(400).json({
            error: "Please provide all required student details."
        });
    }

    const studentCgpa = Number(cgpa);

    if (
        !Number.isFinite(studentCgpa) ||
        studentCgpa < 0 ||
        studentCgpa > 10
    ) {
        return res.status(400).json({
            error: "CGPA must be between 0 and 10."
        });
    }

    const sql = `
        UPDATE students
        SET name = ?, roll_no = ?, branch = ?, cgpa = ?, email = ?
        WHERE student_id = ?
    `;

    const values = [
        name.trim(),
        roll_no.trim(),
        branch.trim(),
        studentCgpa,
        email.trim(),
        studentId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Update student error:", err.message);
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Student not found or no changes were made."
            });
        }

        res.json({
            message: "Student updated successfully!",
            student_id: studentId
        });
    });
});

// ========================================
// STUDENTS: DELETE
// ========================================
app.delete("/students/:id", (req, res) => {
    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        return res.status(400).json({ error: "Invalid student ID." });
    }

    db.query(
        "DELETE FROM students WHERE student_id = ?",
        [studentId],
        (err, result) => {
            if (err) {
                console.error("Delete student error:", err.message);

                if (err.code === "ER_ROW_IS_REFERENCED_2") {
                    return res.status(409).json({
                        error: "This student has applications. Delete related applications first."
                    });
                }

                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Student not found." });
            }

            res.json({
                message: "Student deleted successfully!"
            });
        }
    );
});

// ========================================
// COMPANIES: GET ALL
// ========================================
app.get("/companies", (req, res) => {
    db.query(
        "SELECT * FROM companies ORDER BY company_id DESC",
        (err, results) => {
            if (err) {
                console.error("Get companies error:", err.message);
                return res.status(500).json({ error: err.message });
            }

            res.json(results);
        }
    );
});

// ========================================
// COMPANIES: GET ONE
// ========================================
app.get("/companies/:id", (req, res) => {
    const companyId = Number(req.params.id);

    if (!Number.isInteger(companyId) || companyId <= 0) {
        return res.status(400).json({ error: "Invalid company ID." });
    }

    db.query(
        "SELECT * FROM companies WHERE company_id = ?",
        [companyId],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: "Company not found." });
            }

            res.json(results[0]);
        }
    );
});

// ========================================
// COMPANIES: REGISTER
// ========================================
app.post("/companies", (req, res) => {
    const {
        company_name,
        job_role,
        package: salaryPackage,
        eligibility_cgpa,
        drive_date
    } = req.body;

    if (
        !company_name?.trim() ||
        !job_role?.trim() ||
        salaryPackage === undefined ||
        salaryPackage === "" ||
        eligibility_cgpa === undefined ||
        eligibility_cgpa === "" ||
        !drive_date
    ) {
        return res.status(400).json({
            error: "Please provide all required company details."
        });
    }

    const salary = Number(salaryPackage);
    const minimumCgpa = Number(eligibility_cgpa);

    if (!Number.isFinite(salary) || salary < 0) {
        return res.status(400).json({
            error: "Package must be a valid non-negative number."
        });
    }

    if (
        !Number.isFinite(minimumCgpa) ||
        minimumCgpa < 0 ||
        minimumCgpa > 10
    ) {
        return res.status(400).json({
            error: "Minimum CGPA must be between 0 and 10."
        });
    }

    const sql = `
        INSERT INTO companies
        (company_name, job_role, package, eligibility_cgpa, drive_date)
        VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
        company_name.trim(),
        job_role.trim(),
        salary,
        minimumCgpa,
        drive_date
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Company registration error:", err.message);
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
            message: "Company registered successfully!",
            company_id: result.insertId
        });
    });
});

// ========================================
// COMPANIES: UPDATE
// ========================================
app.put("/companies/:id", (req, res) => {
    const companyId = Number(req.params.id);

    const {
        company_name,
        job_role,
        package: salaryPackage,
        eligibility_cgpa,
        drive_date
    } = req.body;

    if (!Number.isInteger(companyId) || companyId <= 0) {
        return res.status(400).json({ error: "Invalid company ID." });
    }

    if (
        !company_name?.trim() ||
        !job_role?.trim() ||
        salaryPackage === undefined ||
        salaryPackage === "" ||
        eligibility_cgpa === undefined ||
        eligibility_cgpa === "" ||
        !drive_date
    ) {
        return res.status(400).json({
            error: "Please provide all required company details."
        });
    }

    const salary = Number(salaryPackage);
    const minimumCgpa = Number(eligibility_cgpa);

    if (!Number.isFinite(salary) || salary < 0) {
        return res.status(400).json({
            error: "Package must be a valid non-negative number."
        });
    }

    if (
        !Number.isFinite(minimumCgpa) ||
        minimumCgpa < 0 ||
        minimumCgpa > 10
    ) {
        return res.status(400).json({
            error: "Minimum CGPA must be between 0 and 10."
        });
    }

    const sql = `
        UPDATE companies
        SET company_name = ?, job_role = ?, package = ?,
            eligibility_cgpa = ?, drive_date = ?
        WHERE company_id = ?
    `;

    const values = [
        company_name.trim(),
        job_role.trim(),
        salary,
        minimumCgpa,
        drive_date,
        companyId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Update company error:", err.message);
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Company not found or no changes were made."
            });
        }

        res.json({
            message: "Company updated successfully!",
            company_id: companyId
        });
    });
});

// ========================================
// COMPANIES: DELETE
// ========================================
app.delete("/companies/:id", (req, res) => {
    const companyId = Number(req.params.id);

    if (!Number.isInteger(companyId) || companyId <= 0) {
        return res.status(400).json({ error: "Invalid company ID." });
    }

    db.query(
        "DELETE FROM companies WHERE company_id = ?",
        [companyId],
        (err, result) => {
            if (err) {
                console.error("Delete company error:", err.message);

                if (err.code === "ER_ROW_IS_REFERENCED_2") {
                    return res.status(409).json({
                        error: "This company has applications. Delete related applications first."
                    });
                }

                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Company not found." });
            }

            res.json({
                message: "Company deleted successfully!"
            });
        }
    );
});

// ========================================
// APPLICATIONS: GET ALL
// ========================================
app.get("/applications", (req, res) => {
    const sql = `
        SELECT
            a.application_id,
            a.student_id,
            a.company_id,
            s.name AS student_name,
            s.roll_no,
            c.company_name,
            c.job_role,
            c.package,
            a.applied_date,
            a.round,
            a.status
        FROM applications a
        JOIN students s ON a.student_id = s.student_id
        JOIN companies c ON a.company_id = c.company_id
        ORDER BY a.application_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Get applications error:", err.message);
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
});

// ========================================
// APPLICATIONS: GET ONE
// ========================================
app.get("/applications/:id", (req, res) => {
    const applicationId = Number(req.params.id);

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
        return res.status(400).json({ error: "Invalid application ID." });
    }

    const sql = `
        SELECT
            a.application_id,
            a.student_id,
            a.company_id,
            s.name AS student_name,
            c.company_name,
            c.job_role,
            a.applied_date,
            a.round,
            a.status
        FROM applications a
        JOIN students s ON a.student_id = s.student_id
        JOIN companies c ON a.company_id = c.company_id
        WHERE a.application_id = ?
    `;

    db.query(sql, [applicationId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "Application not found."
            });
        }

        res.json(results[0]);
    });
});

// ========================================
// APPLICATIONS: CREATE
// ========================================
app.post("/applications", (req, res) => {
    const {
        student_id,
        company_id,
        applied_date,
        round,
        status
    } = req.body;

    if (
        student_id === undefined ||
        student_id === "" ||
        company_id === undefined ||
        company_id === "" ||
        !applied_date ||
        !round?.trim() ||
        !status?.trim()
    ) {
        return res.status(400).json({
            error: "Please provide student, company, date, round and status."
        });
    }

    const studentId = Number(student_id);
    const companyId = Number(company_id);

    if (
        !Number.isInteger(studentId) ||
        studentId <= 0 ||
        !Number.isInteger(companyId) ||
        companyId <= 0
    ) {
        return res.status(400).json({
            error: "Student ID and company ID must be positive integers."
        });
    }

    const sql = `
        INSERT INTO applications
        (student_id, company_id, applied_date, \`round\`, status)
        VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
        studentId,
        companyId,
        applied_date,
        round.trim(),
        status.trim()
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Create application error:", err.message);
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
            message: "Application created successfully!",
            application_id: result.insertId
        });
    });
});

// ========================================
// APPLICATIONS: UPDATE
// ========================================
app.put("/applications/:id", (req, res) => {
    const applicationId = Number(req.params.id);
    const { round, status } = req.body;

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
        return res.status(400).json({
            error: "Invalid application ID."
        });
    }

    if (!round?.trim() || !status?.trim()) {
        return res.status(400).json({
            error: "Please provide both recruitment round and status."
        });
    }

    const sql = `
        UPDATE applications
        SET \`round\` = ?, status = ?
        WHERE application_id = ?
    `;

    db.query(
        sql,
        [round.trim(), status.trim(), applicationId],
        (err, result) => {
            if (err) {
                console.error("Update application error:", err.message);
                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: "Application not found or no changes were made."
                });
            }

            res.json({
                message: "Application updated successfully!",
                application_id: applicationId
            });
        }
    );
});

// ========================================
// APPLICATIONS: DELETE
// ========================================
app.delete("/applications/:id", (req, res) => {
    const applicationId = Number(req.params.id);

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
        return res.status(400).json({
            error: "Invalid application ID."
        });
    }

    db.query(
        "DELETE FROM applications WHERE application_id = ?",
        [applicationId],
        (err, result) => {
            if (err) {
                console.error("Delete application error:", err.message);
                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: "Application not found."
                });
            }

            res.json({
                message: "Application deleted successfully!",
                application_id: applicationId
            });
        }
    );
});

// ========================================
// SEARCH: STUDENTS
// ========================================
function searchStudents(keyword, callback) {
    const value = `%${keyword}%`;

    const sql = `
        SELECT * FROM students
        WHERE CAST(student_id AS CHAR) LIKE ?
        OR name LIKE ?
        OR roll_no LIKE ?
        OR branch LIKE ?
        OR email LIKE ?
        ORDER BY student_id DESC
    `;

    db.query(sql, [
        value, value, value, value, value
    ], callback);
}

// ========================================
// SEARCH: COMPANIES
// ========================================
function searchCompanies(keyword, callback) {
    const value = `%${keyword}%`;

    const sql = `
        SELECT * FROM companies
        WHERE CAST(company_id AS CHAR) LIKE ?
        OR company_name LIKE ?
        OR job_role LIKE ?
        ORDER BY company_id DESC
    `;

    db.query(sql, [
        value, value, value
    ], callback);
}

// ========================================
// SEARCH: APPLICATIONS
// ========================================
function searchApplications(keyword, callback) {
    const value = `%${keyword}%`;

    const sql = `
        SELECT
            a.application_id,
            a.student_id,
            a.company_id,
            s.name AS student_name,
            s.roll_no,
            c.company_name,
            c.job_role,
            c.package,
            a.applied_date,
            a.round,
            a.status
        FROM applications a
        JOIN students s ON a.student_id = s.student_id
        JOIN companies c ON a.company_id = c.company_id
        WHERE CAST(a.application_id AS CHAR) LIKE ?
        OR s.name LIKE ?
        OR s.roll_no LIKE ?
        OR c.company_name LIKE ?
        OR c.job_role LIKE ?
        OR a.round LIKE ?
        OR a.status LIKE ?
        ORDER BY a.application_id DESC
    `;

    db.query(sql, [
        value, value, value, value,
        value, value, value
    ], callback);
}

// ========================================
// SEARCH API
// ========================================
app.get("/search", (req, res) => {
    const keyword = req.query.keyword?.trim();
    const type = req.query.type || "all";

    if (!keyword) {
        return res.status(400).json({
            error: "Please enter something to search."
        });
    }

    if (type === "students") {
        return searchStudents(keyword, (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json(results);
        });
    }

    if (type === "companies") {
        return searchCompanies(keyword, (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json(results);
        });
    }

    if (type === "applications") {
        return searchApplications(keyword, (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json(results);
        });
    }

    if (type === "all") {
        const results = {};
        let completed = 0;
        let hasError = false;

        const finish = (key, err, data) => {
            if (hasError) return;

            if (err) {
                hasError = true;
                return res.status(500).json({
                    error: err.message
                });
            }

            results[key] = data;
            completed++;

            if (completed === 3) {
                res.json(results);
            }
        };

        searchStudents(keyword, (err, data) => {
            finish("students", err, data);
        });

        searchCompanies(keyword, (err, data) => {
            finish("companies", err, data);
        });

        searchApplications(keyword, (err, data) => {
            finish("applications", err, data);
        });

        return;
    }

    res.status(400).json({
        error: "Invalid search category."
    });
});

// ========================================
// UNKNOWN API ROUTES
// ========================================
app.use("/students", (req, res) => {
    res.status(404).json({
        error: "Student API route not found."
    });
});

app.use("/companies", (req, res) => {
    res.status(404).json({
        error: "Company API route not found."
    });
});

app.use("/applications", (req, res) => {
    res.status(404).json({
        error: "Application API route not found."
    });
});

// ========================================
// GENERAL ERROR HANDLER
// ========================================
app.use((err, req, res, next) => {
    console.error("Server error:", err.message);

    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        error: err.status === 400
            ? "Invalid request. Check the submitted data."
            : "An unexpected server error occurred."
    });
});

// ========================================
// START SERVER
// ========================================
app.listen(PORT, () => {
    console.log(
        `College Placement System running at http://localhost:${PORT}`
    );
});

