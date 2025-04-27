// proID/backend/src/routes/authRoutes.js - UPDATED WITH LOGIN
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // <<<--- Import jsonwebtoken
const { pool } = require('../db');

console.log('--- authRoutes.js file loaded ---');

const router = express.Router();
const saltRounds = 10;

// POST /api/auth/register
router.post('/register', async (req, res) => {
    console.log('>>> POST /api/auth/register endpoint hit <<<');
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (!email.includes('@')) {
         return res.status(400).json({ message: 'Invalid email format.' });
    }

    try {
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ message: 'Email already in use.' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = await pool.query(
            'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING user_id, email, name, created_at',
            [email, hashedPassword, name]
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser.rows[0]
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Internal server error during registration.' });
    }
});

// POST /api/auth/login - // *** LOGIN LOGIC IMPLEMENTED ***
router.post('/login', async (req, res) => {
    console.log('>>> POST /api/auth/login endpoint hit <<<');
    const { email, password } = req.body;

    // Basic input validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // --- Find user by email ---
        // Important: Select password_hash to compare it later
        const userResult = await pool.query('SELECT user_id, email, name, password_hash FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            // User not found
            console.log(`Login attempt failed: User not found for email ${email}`);
            return res.status(401).json({ message: 'Invalid credentials.' }); // Use generic message for security
        }

        const user = userResult.rows[0];

        // --- Compare submitted password with stored hash ---
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            // Password doesn't match
             console.log(`Login attempt failed: Incorrect password for email ${email}`);
            return res.status(401).json({ message: 'Invalid credentials.' }); // Use generic message for security
        }

        // --- Password matches: Generate JWT ---
        // Ensure you have a strong, secret key in your .env file (JWT_SECRET)
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
            // Don't reveal specific config errors to the client
            return res.status(500).json({ message: 'Login processing error.' });
        }

        // Create payload for the token
        const payload = {
            userId: user.user_id,
            email: user.email
            // You can add role or other non-sensitive identifiers here if needed
        };

        // Sign the token
        const token = jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '1h' } // Example: Token expires in 1 hour (adjust as needed)
        );

        // --- Send Token to Client ---
        console.log(`Login successful for email ${email}`);
        res.status(200).json({
             message: 'Login successful',
             token: token // Send the generated JWT
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
});

module.exports = router;