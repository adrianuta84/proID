// proID/backend/src/routes/userRoutes.js - FINAL VERSION with Phone Routes
const express = require('express');
const { pool } = require('../db');
const { protect } = require('../middleware/authMiddleware'); // Import the protect middleware

const router = express.Router();

// --- Get Current User's Profile ---
// GET /api/users/me
router.get('/me', protect, async (req, res) => {
    // req.userId is attached by the 'protect' middleware
    console.log(`>>> GET /api/users/me request for userId: ${req.userId}`);
    try {
        const userResult = await pool.query(
            'SELECT user_id, email, name, created_at FROM users WHERE user_id = $1',
            [req.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(userResult.rows[0]);
    } catch (error) {
        console.error(`Get User Profile Error for userId ${req.userId}:`, error);
        res.status(500).json({ message: 'Internal server error fetching profile.' });
    }
});

// --- Get User's Phone Numbers --- // *** THESE ARE THE ADDED ROUTES ***
// GET /api/users/me/phones
// Protected route
router.get('/me/phones', protect, async (req, res) => {
    // req.userId is available because 'protect' middleware ran successfully
    console.log(`>>> GET /api/users/me/phones request for userId: ${req.userId}`);
    try {
        const phoneResult = await pool.query(
            'SELECT phone_id, phone_number, label FROM phone_numbers WHERE user_id = $1 ORDER BY created_at ASC',
            [req.userId]
        );
        // Return array of phone numbers (can be empty)
        res.status(200).json(phoneResult.rows);
    } catch (error) {
        console.error(`Get User Phones Error for userId ${req.userId}:`, error);
        res.status(500).json({ message: 'Internal server error fetching phone numbers.' });
    }
});

// --- Add a Phone Number for User --- // *** THESE ARE THE ADDED ROUTES ***
// POST /api/users/me/phones
// Protected route
router.post('/me/phones', protect, async (req, res) => {
    // req.userId is available
    const { phone_number, label } = req.body;
    console.log(`>>> POST /api/users/me/phones request for userId: ${req.userId} with number: ${phone_number}`);

    // Basic validation
    if (!phone_number) {
        return res.status(400).json({ message: 'Phone number is required.' });
    }
    // Add more specific validation if needed (length, format etc.)

    try {
        const newPhone = await pool.query(
            'INSERT INTO phone_numbers (user_id, phone_number, label) VALUES ($1, $2, $3) RETURNING phone_id, phone_number, label',
            [req.userId, phone_number, label || null] // Use label if provided, else null
        );
        res.status(201).json(newPhone.rows[0]); // Return the newly created phone number object
    } catch (error) {
        console.error(`Add User Phone Error for userId ${req.userId}:`, error);
        // Could check for specific DB errors like unique constraints if you added them
        res.status(500).json({ message: 'Internal server error adding phone number.' });
    }
});


// --- TODO: Add routes for updating/deleting phones ---
// --- TODO: Add routes for emails, addresses, IDs etc. ---

module.exports = router;