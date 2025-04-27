// proID/backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
// const { pool } = require('../db'); // Pool might be needed later

const protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header (Bearer <token>)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Extract token from "Bearer <token>" string
            token = req.headers.authorization.split(' ')[1];

            // Verify token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user id to the request object
            req.userId = decoded.userId; // From the payload we created during login

            next(); // Proceed to the protected route

        } catch (error) {
            console.error('Token verification failed:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed.' });
        }
    }

    // If no token was found in the header at all
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token.' });
    }
};

module.exports = { protect };