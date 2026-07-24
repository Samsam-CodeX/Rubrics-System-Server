import express from 'express';
import cors from 'cors';
import pool from './db.js';

const app = express();
const PORT = 3000;


app.use(cors());
app.use(express.json());
app.use(express.static('public'));



// 1. Get all students
app.get('/api/students', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM students');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching students:', error.message);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});