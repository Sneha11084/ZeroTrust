const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./database');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = result.rows[0] || null;
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile?.emails?.[0]?.value;
        const name = profile?.displayName || '';
        const googleId = profile?.id;

        if (!email) {
          return done(new Error('No email address was returned from Google'));
        }

        const existingUserResult = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );

        if (existingUserResult.rows.length > 0) {
          return done(null, existingUserResult.rows[0]);
        }

        const insertResult = await pool.query(
          'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
          [email, null]
        );

        return done(null, insertResult.rows[0]);
      } catch (err) {
        console.error('Google OAuth verify callback error:', err);
        return done(err);
      }
    }
  )
);

module.exports = passport;
