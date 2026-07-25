import express from 'express';
import pool from './db.js';


const app = express();
const PORT = 3000;


app.use(express.json()); 
app.use(express.static('app')); //automatically server the index.html



// ---------------- API Routes -----------------------//
app.get('/api/students', async (req, res) => {
    try {

        const [rows] = await pool.query('SELECT * FROM students');

        if (!rows.length) {
            return res.status(404).json({
                error: 'No students found'
            });
        }

        res.status(200).json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Internal server error'
        });

    }
});


app.get('/api/students/:id', async (req, res) => {
    try {

        const id = Number(req.params.id);

        const [rows] = await pool.query(
            'SELECT * FROM students WHERE studentId = ?;',
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({
                error: 'Student not found'
            });
        }

        res.status(200).json(rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Internal server error'
        });

    }
});



app.get('/api/students/:id/ratings', async (req, res) => {
    try {
        const id = Number(req.params.id);

        const [studentRows] = await pool.query(
            `SELECT
                s.studentId,
                CONCAT(s.firstName, ' ', s.lastName) AS fullName,
                s.groupNumber,
                ROUND(AVG(
                    r.content_accuracy +
                    r.understanding_topic +
                    r.organization_structure +
                    r.delivery_communication +
                    r.audience_engagement +
                    r.visual_aids +
                    r.professional_appearance +
                    r.teamwork +
                    r.time_allocation +
                    r.strategy
                ), 2) AS studentAverage,

                COUNT(r.student_id) AS totalRaters
            FROM students s
            LEFT JOIN ratings r ON s.studentId = r.student_id
            WHERE s.studentId = ?
            GROUP BY s.studentId;
            `,
            [id]
        );

        if (!studentRows.length) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const student = studentRows[0];

        const [ratings] = await pool.query(
            `SELECT
                r.*,
                CONCAT(u.firstName, ' ', u.lastName) AS raterName,
                (r.content_accuracy +
                 r.understanding_topic +
                 r.organization_structure +
                 r.delivery_communication +
                 r.audience_engagement +
                 r.visual_aids +
                 r.professional_appearance +
                 r.teamwork +
                 r.time_allocation +
                 r.strategy) AS totalScore
            FROM ratings r
            JOIN students u ON u.studentId = r.rater_id
            WHERE r.student_id = ?
            ORDER BY raterName;
            `,
            [id]
        );

        const [notRated] = await pool.query(
            `SELECT
                s.studentId,
                CONCAT(s.firstName, ' ', s.lastName) AS fullName
            FROM students s
            WHERE s.studentId <> ?
              AND s.groupNumber != ?
              AND s.studentId NOT IN (
                  SELECT rater_id FROM ratings WHERE student_id = ?
              )
            ORDER BY s.lastName, s.firstName;
            `,
            [id, student.groupNumber, id]
        );

        res.json({ student, ratings, notRated });
    } catch (error) {
        console.error('Error fetching student ratings:', error.message);
        res.status(500).json({ error: 'Failed to fetch student ratings' });
    }
});

app.get('/api/student-dashboard/:id', async (req, res) => {
    try {
        const studentId = Number(req.params.id);

        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required' });
        }

        const [studentRows] = await pool.query(
            `SELECT
                s.studentId,
                CONCAT(s.firstName, ' ', s.lastName) AS fullName,
                s.groupNumber,
                ROUND(AVG(
                    r.content_accuracy +
                    r.understanding_topic +
                    r.organization_structure +
                    r.delivery_communication +
                    r.audience_engagement +
                    r.visual_aids +
                    r.professional_appearance +
                    r.teamwork +
                    r.time_allocation +
                    r.strategy
                ), 2) AS studentAverage,
                COUNT(r.student_id) AS totalRaters
            FROM students s
            LEFT JOIN ratings r ON s.studentId = r.student_id
            WHERE s.studentId = ?
            GROUP BY s.studentId;
            `,
            [studentId]
        );

        if (!studentRows.length) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const student = studentRows[0];

        const [groups] = await pool.query(
            `SELECT
                s.groupNumber,
                COUNT(*) AS totalStudents,
                COUNT(DISTINCT r.student_id) AS ratedCount
            FROM students s
            LEFT JOIN ratings r
                ON r.student_id = s.studentId
                AND r.rater_id = ?
            WHERE s.groupNumber <> ?
            GROUP BY s.groupNumber
            ORDER BY s.groupNumber;
            `,
            [studentId, student.groupNumber]
        );

        const groupsWithStatus = groups.map(group => ({
            groupNumber: group.groupNumber,
            totalStudents: group.totalStudents,
            ratedCount: group.ratedCount,
            status: group.ratedCount >= group.totalStudents ? 'Complete' : 'Pending',
            progress: `${group.ratedCount}/${group.totalStudents}`
        }));

        res.status(200).json({ student, groups: groupsWithStatus });
    } catch (error) {
        console.error('Failed to load student dashboard:', error);
        res.status(500).json({ error: 'Failed to load student dashboard' });
    }
});


//return only one group data
app.get('/api/groups/:groupNumber', async (req, res) => {
    try {
        const groupNumber = Number(req.params.groupNumber);
        const raterId = Number(req.query.raterId) || 0;

        const [groups] = await pool.query(
            'SELECT groupNumber, COUNT(*) AS totalStudents FROM students GROUP BY groupNumber ORDER BY groupNumber;'
        );

        const [students] = await pool.query(`
            SELECT
                s.studentId,
                CONCAT(s.firstName, ' ', s.lastName) AS fullName,
                s.groupNumber,
                ROUND(averages.studentAverage, 2) AS studentAverage,
                IF(rr.rater_id IS NULL, 0, 1) AS ratedByMe
            FROM students s
            LEFT JOIN (
                SELECT
                    student_id,
                    AVG(
                        content_accuracy +
                        understanding_topic +
                        organization_structure +
                        delivery_communication +
                        audience_engagement +
                        visual_aids +
                        professional_appearance +
                        teamwork +
                        time_allocation +
                        strategy
                    ) AS studentAverage
                FROM ratings
                GROUP BY student_id
            ) AS averages ON s.studentId = averages.student_id
            LEFT JOIN ratings rr
                ON rr.student_id = s.studentId
                AND rr.rater_id = ?
            ORDER BY
                s.groupNumber,
                s.studentId;
        `, [raterId]);

        const [groupAverage] = await pool.query(`
            SELECT
                s.groupNumber,
                ROUND(AVG(studentAverage), 2) AS groupAverage
            FROM students s
            LEFT JOIN (
                SELECT
                    student_id,
                    AVG(
                        content_accuracy +
                        understanding_topic +
                        organization_structure +
                        delivery_communication +
                        audience_engagement +
                        visual_aids +
                        professional_appearance +
                        teamwork +
                        time_allocation +
                        strategy
                    ) AS studentAverage
                FROM ratings
                GROUP BY student_id
            ) AS averages ON s.studentId = averages.student_id
            GROUP BY s.groupNumber
            ORDER BY s.groupNumber;
        `);

        const group = groups.find(g => g.groupNumber === groupNumber);

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const members = students
            .filter(student => student.groupNumber === groupNumber)
            .map(student => ({
                studentId: student.studentId,
                fullName: student.fullName,
                studentAverage: student.studentAverage,
                ratedByMe: Boolean(student.ratedByMe)
            }));

        const average = groupAverage.find(avg => avg.groupNumber === groupNumber);

        const response = {
            groupNumber: group.groupNumber,
            totalStudents: group.totalStudents,
            groupAverageRating: average ? average.groupAverage : null,
            members: members
        };

        res.json(response);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});



//return all the group data
app.get('/api/dashboard', async (req, res) => {
    try {

        const response = [];

        const [groups] = await pool.query(`
            SELECT
                groupNumber,
                COUNT(*) AS totalStudents
            FROM students
            GROUP BY groupNumber
            ORDER BY groupNumber;
        `);

        if (!groups.length) {
            return res.status(404).json({
                error: 'No groups found'
            });
        }

        const [students] = await pool.query(`
            SELECT
                s.studentId,
                CONCAT(s.firstName, ' ', s.lastName) AS fullName,
                s.groupNumber,
                ROUND(averages.studentAverage, 2) AS studentAverage
            FROM students s
            LEFT JOIN (
                SELECT
                    student_id,
                    AVG(
                        content_accuracy +
                        understanding_topic +
                        organization_structure +
                        delivery_communication +
                        audience_engagement +
                        visual_aids +
                        professional_appearance +
                        teamwork +
                        time_allocation +
                        strategy
                    ) AS studentAverage
                FROM ratings
                GROUP BY student_id
            ) AS averages
            ON s.studentId = averages.student_id
            ORDER BY
                s.groupNumber,
                s.studentId;
        `);
        const [groupAverage] = await pool.query(`
            SELECT
                s.groupNumber,
                ROUND(AVG(studentAverage), 2) AS groupAverage
            FROM students s
            LEFT JOIN (
                SELECT
                    student_id,
                    AVG(
                        content_accuracy +
                        understanding_topic +
                        organization_structure +
                        delivery_communication +
                        audience_engagement +
                        visual_aids +
                        professional_appearance +
                        teamwork +
                        time_allocation +
                        strategy
                    ) AS studentAverage
                FROM ratings
                GROUP BY student_id
            ) AS averages
            ON s.studentId = averages.student_id
            GROUP BY s.groupNumber
            ORDER BY s.groupNumber;
        `);

        for (const group of groups) {

            const members = students.filter(student =>
                student.groupNumber === group.groupNumber
            );

            const average = groupAverage.find(avg =>
                avg.groupNumber === group.groupNumber
            );

            response.push({
                groupNumber: group.groupNumber,
                totalStudents: group.totalStudents,
                groupAverageRating: average ? average.groupAverage : null,
                members
            });

        }

        res.status(200).json(response);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Internal server error'
        });

    }
});







// ---------------- LOGIN ROUTE -----------------------//

app.post('/api/auth/login', async (req, res) => {
    try {

        const { studentId, password } = req.body;


        // Validate input
        if (!studentId || !password) {
            return res.status(400).json({
                error: "Student ID and password are required"
            });
        }


        const [rows] = await pool.query(
            `
            SELECT 
                studentId,
                firstName,
                lastName,
                groupNumber,
                password
            FROM students
            WHERE studentId = ?
            `,
            [studentId]
        );


        // Student ID not found
        if (!rows.length) {
            return res.status(404).json({
                error: "Student not found"
            });
        }


        const student = rows[0];


        // Check password
        if (student.password !== password) {
            return res.status(401).json({
                error: "Incorrect password"
            });
        }

        // Remove password before sending response
        delete student.password;


        res.status(200).json({
            message: "Login successful",
            student
        });


    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
});



app.post('/api/auth/register', async (req, res) => {
    try {
        const {
            studentId,
            firstName,
            lastName,
            groupNumber,
            password,
            chkpassword
        } = req.body;

        // Basic validation
        if (!studentId || !firstName || !lastName || !groupNumber || !password || !chkpassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password !== chkpassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        // Check if studentId already exists
        const [existing] = await pool.query(
            'SELECT studentId FROM students WHERE studentId = ?',
            [studentId]
        );

        if (existing.length) {
            return res.status(409).json({ error: 'Student ID already registered' });
        }

        // Insert new student
        await pool.query(
            `INSERT INTO students (studentId, firstName, lastName, groupNumber, password)
             VALUES (?, ?, ?, ?, ?)`,
            [studentId, firstName, lastName, groupNumber, password]
        );

        return res.status(201).json({ message: 'Registration successful' });

    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/access_admin', (req, res) => {

    const { accessCode } = req.body;

    const access_code = process.env.ADMIN_ACCESS_CODE;

    if (accessCode !== access_code) {
        return res.status(401).json({ error: 'Invalid access code' });
    }

    return res.status(200).json({ message: 'Access accepted' });

});

app.post('/api/ratings', async (req, res) => {
    try {
        const {
            raterId,
            studentId,
            content_accuracy,
            understanding_topic,
            organization_structure,
            delivery_communication,
            audience_engagement,
            visual_aids,
            professional_appearance,
            teamwork,
            time_allocation,
            strategy
        } = req.body;

        if (!raterId || !studentId || !content_accuracy || !understanding_topic || !organization_structure || !delivery_communication || !audience_engagement || !visual_aids || !professional_appearance || !teamwork || !time_allocation || !strategy) {
            return res.status(400).json({ error: 'All rating fields are required' });
        }

        if (Number(raterId) === Number(studentId)) {
            return res.status(400).json({ error: 'You cannot rate yourself' });
        }

        const [raterRows] = await pool.query('SELECT groupNumber FROM students WHERE studentId = ?', [raterId]);
        const [studentRows] = await pool.query('SELECT groupNumber FROM students WHERE studentId = ?', [studentId]);

        if (!raterRows.length || !studentRows.length) {
            return res.status(404).json({ error: 'Student not found' });
        }

        if (raterRows[0].groupNumber === studentRows[0].groupNumber) {
            return res.status(400).json({ error: 'Cannot rate a student from the same group' });
        }

        const [existing] = await pool.query('SELECT * FROM ratings WHERE rater_id = ? AND student_id = ?', [raterId, studentId]);

        if (existing.length) {
            return res.status(409).json({ error: 'Rating already exists' });
        }

        await pool.query(
            `INSERT INTO ratings (
                rater_id,
                student_id,
                content_accuracy,
                understanding_topic,
                organization_structure,
                delivery_communication,
                audience_engagement,
                visual_aids,
                professional_appearance,
                teamwork,
                time_allocation,
                strategy
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                raterId,
                studentId,
                content_accuracy,
                understanding_topic,
                organization_structure,
                delivery_communication,
                audience_engagement,
                visual_aids,
                professional_appearance,
                teamwork,
                time_allocation,
                strategy
            ]
        );

        res.status(201).json({ message: 'Rating submitted successfully' });
    } catch (error) {
        console.error('Submit rating error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});