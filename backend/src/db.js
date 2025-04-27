// proID/backend/src/db.js
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Add SSL config here for production environments if needed
    // ssl: { rejectUnauthorized: false }
});

// Optional: Test connection when this module loads
pool.connect((err, client, release) => {
    if (err) { return console.error('DB Pool Error connecting in db.js', err.stack); }
    client.query('SELECT NOW()', (err, result) => {
        release();
        if (err) { return console.error('DB Pool Error executing query in db.js', err.stack); }
        console.log('PostgreSQL connected via db.js pool:', result.rows[0].now);
    });
});

module.exports = { pool }; // Export the pool instance