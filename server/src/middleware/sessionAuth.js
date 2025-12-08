/**
 * Session Authentication Middleware
 * Protects routes by checking for authenticated session
 * Used for static files and React SPA routes
 */
function sessionAuth(req, res, next) {
  // Allow access to login page and static assets
  if (req.path === '/login.html' ||
      req.path.startsWith('/assets/') ||
      req.path.startsWith('/static/')) {
    return next();
  }

  // Check if user is authenticated via session
  if (req.session && req.session.authenticated === true) {
    return next();
  }

  // Not authenticated - return 401
  return res.status(401).json({
    error: 'Authentication required',
    authenticated: false
  });
}

module.exports = sessionAuth;
