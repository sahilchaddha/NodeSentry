/**
 * HTTP Basic Authentication Middleware
 * Protects routes with username/password authentication
 */
function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="NodeSentry"');
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Extract and decode credentials
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  // Get credentials from environment
  const validUsername = process.env.BASIC_AUTH_USER || 'admin';
  const validPassword = process.env.BASIC_AUTH_PASS || 'changeme';

  // Verify credentials
  if (username === validUsername && password === validPassword) {
    next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="NodeSentry"');
    return res.status(401).json({ error: 'Invalid credentials' });
  }
}

module.exports = basicAuth;
