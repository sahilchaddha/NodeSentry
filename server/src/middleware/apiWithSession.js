/**
 * API Session Middleware
 * Checks session authentication and injects Basic Auth header
 * Used for API routes that need both session and Basic Auth
 */
function apiWithSession(req, res, next) {
  // Check session authentication
  if (!req.session || !req.session.authenticated) {
    return res.status(401).json({
      error: 'Authentication required',
      authenticated: false
    });
  }

  // Extract credentials from session and inject Basic Auth header
  const username = req.session.username;
  const password = req.session.password;

  if (!username || !password) {
    return res.status(500).json({
      error: 'Session credentials missing'
    });
  }

  // Create Basic Auth header
  const credentials = `${username}:${password}`;
  const base64Credentials = Buffer.from(credentials).toString('base64');
  req.headers.authorization = `Basic ${base64Credentials}`;

  // Continue to next middleware (basicAuth will validate)
  next();
}

module.exports = apiWithSession;
