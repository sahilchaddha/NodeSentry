const express = require('express');
const router = express.Router();
const crypto = require('crypto');

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    // Use a dummy comparison to prevent length-based timing
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password required'
      });
    }

    // Get valid credentials from environment
    const validUsername = process.env.BASIC_AUTH_USER || 'admin';
    const validPassword = process.env.BASIC_AUTH_PASS || 'changeme';

    // Timing-safe comparison
    const usernameMatch = timingSafeEqual(username, validUsername);
    const passwordMatch = timingSafeEqual(password, validPassword);

    if (usernameMatch && passwordMatch) {
      // Set session data
      req.session.authenticated = true;
      req.session.username = username;
      req.session.password = password;

      // Save session before responding
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({
            success: false,
            error: 'Session creation failed'
          });
        }

        res.json({
          success: true,
          message: 'Login successful'
        });
      });
    } else {
      // Invalid credentials
      res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/logout
 * Destroy session and log out user
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }

    res.clearCookie('nodesentry.sid');
    res.json({
      success: true,
      message: 'Logout successful'
    });
  });
});

/**
 * GET /api/auth/check
 * Check if user is authenticated
 */
router.get('/check', (req, res) => {
  if (req.session && req.session.authenticated) {
    res.json({
      authenticated: true,
      username: req.session.username
    });
  } else {
    res.status(401).json({
      authenticated: false
    });
  }
});

module.exports = router;
