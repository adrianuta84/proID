// proID/backend/src/server.js - FINAL CORRECTED VERSION
require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
// --- Pool creation/connection handled in db.js ---

const app = express();
const port = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
// Health Check Route (Keep this)
app.get('/api/health', (req, res) => {
    res.json({ status: 'UP', timestamp: new Date().toISOString(), app: 'proID Backend' });
});

// --- Import and Use Auth Routes --- // *** ADDED BACK CORRECTLY ***
console.log('>>> Mounting /api/auth routes'); // For checking logs
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// --- Error Handling ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Server Error!');
});

// --- Start Server ---
app.listen(port, '0.0.0.0', () => {
    // Using simple concatenation for safety
    console.log('proID Backend listening at http://0.0.0.0:' + port);
});

// --- NO module.exports needed here ---