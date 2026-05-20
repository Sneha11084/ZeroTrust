const pool = require('./database');

// This function creates all the tables ZeroTrust needs
// It uses IF NOT EXISTS so it won't fail if tables already exist
async function createTables() {
  try {
    console.log('🔄 Creating database tables...');

    // USERS table - stores information about each user who signs up
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      ALTER TABLE users
      ALTER COLUMN password DROP NOT NULL;
    `);
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
    `);
    console.log('  ✓ Created USERS table');

    // LOGIN_ATTEMPTS table - records every login attempt so we can detect fraud
    // risk_score helps identify suspicious logins (0-100, higher = more suspicious)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        risk_score INTEGER DEFAULT 0,
        decision VARCHAR(50),
        country VARCHAR(100),
        city VARCHAR(100),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✓ Created LOGIN_ATTEMPTS table');

    // OTP_CODES table - stores one-time passcodes for email verification
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        otp_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✓ Created OTP_CODES table');

    // BLOCKED_IPS table - stores IP addresses that are flagged as suspicious
    // blocked_at helps track when an IP was added to the blacklist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR(45) UNIQUE NOT NULL,
        reason VARCHAR(255),
        blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✓ Created BLOCKED_IPS table');

    console.log('✅ All database tables created successfully!');
  } catch (err) {
    console.error('❌ Error creating tables:', err);
    process.exit(1); // Stop the server if table creation fails
  }
}

// Export the function so server.js can call it
module.exports = createTables;
