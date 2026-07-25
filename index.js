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


//return only one group data
app.get('/api/groups/:groupNumber', async (req, res) => {
    try {

        const groupNumber = Number(req.params.groupNumber);

        const [groups] = await pool.query(
            'SELECT groupNumber, COUNT(*) AS totalStudents FROM students GROUP BY groupNumber ORDER BY groupNumber;'
        );

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

        const group = groups.find(g =>
            g.groupNumber === groupNumber
        );

        if (!group) {
            return res.status(404).json({error: 'Group not found'});
        }

        const members = students.filter(student =>
            student.groupNumber === groupNumber
        );

        const average = groupAverage.find(avg =>
            avg.groupNumber === groupNumber
        );

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





app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});