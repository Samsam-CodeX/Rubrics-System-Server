import express from 'express';
import pool from './db.js';
import * as query from './queries.js';


const app = express();
const PORT = 3000;


app.use(express.json()); 
app.use(express.static('app')); //automatically server the index.html



// ---------------- API Routes -----------------------//
app.get('/api/students', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM students');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching students:', error.message);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

app.get('/api/students/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [data] = await pool.query(`SELECT * FROM students WHERE studentId = ${id};`);
        res.json(user);
    } catch (error) {
        console.error('Error fetching student:', error.message);
        res.status(500).json({ error: 'Failed to fetch student' });
    }
});

app.get('/api/groups/:groupNumber', async (req, res) => {
    try{
        const groupNumber = req.params.groupNumber;
        const [groups] = await pool.query(`SELECT * FROM students WHERE groupNumber = ${groupNumber};`);
        res.json(groups);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});




app.get('/api/dashboard', async (req, res) => {
    try{
        const response = [];
        
        const [groups] = await pool.query('SELECT groupNumber, COUNT(*) AS totalStudents FROM students GROUP BY groupNumber ORDER BY groupNumber;');
        const [students] = await pool.query(query.studentInfo);
        const [groupAverage] = await pool.query(query.groupAverage);

        for (const group of groups) {

            const members = students.filter(student =>
                student.groupNumber === group.groupNumber
            );

            const [average] = groupAverage.filter(avg => avg.groupNumber === group.groupNumber);
            

            response.push({
                groupNumber: group.groupNumber,
                totalStudents: group.totalStudents,
                groupAverageRating: average.groupAverage,
                members: members
            });

        }

        res.json(response);
    } catch (error) {
        console.error(error.name, error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});





app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});