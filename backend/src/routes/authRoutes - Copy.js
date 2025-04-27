// proID/backend/src/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db'); // Import pool from db.js

console.log('--- authRoutes.js file loaded ---'); // For debugging

const router = express.Router();
const saltRounds = 10;

// POST /api/auth/register
router.post('/register', async (req, res) => {
    console.log('>>> POST /api/auth/register endpoint hit <<<'); // For debugging
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (!email.includes('@')) {
         return res.status(400).json({ message: 'Invalid email format.' });
    }

    try {
        // --- Check if user already exists ---
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userCheck.rows.length > 0) {
            return res.status(409).json({ message: 'Email already in use.' });
        }

        // --- Hash Password ---
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // --- Insert New User ---
        const newUser = await pool.query(
            'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING user_id, email, name, created_at',
            [email, hashedPassword, name]
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser.rows[0]
        });

    } catch (error) {
        console.error('Registration Error:', error); // Keep logging
        res.status(500).json({ message: 'Internal server error during registration.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    // TODO: Implement login logic here
    res.status(501).json({ message: 'Login not implemented yet.' });
});

module.exports = router;