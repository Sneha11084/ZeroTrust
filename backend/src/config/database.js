const { Pool } = require('pg');

// Create a connection pool
// A "pool" lets you reuse database connections instead of creating new ones each time
// This is more efficient for handling multiple requests
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test the connection and log the result
pool.on('connect', () => {
  console.log('✅ Database connected successfully!');
});

pool.on('error', (err) => {
  console.error('❌ Database connection failed', err);
  process.exit(1); // Stop the server if database connection fails
});

// Export the pool so other files can use it to run queries
module.exports = pool;
