/**
 * API Key Authentication Middleware
 * Protects routes with API key validation
 * Clients should send API key in X-API-Key header
 */
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required. Please provide X-API-Key header' });
  }

  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    console.error('API_KEY not configured in environment');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (apiKey === validApiKey) {
    next();
  } else {
    return res.status(403).json({ error: 'Invalid API key' });
  }
}

module.exports = apiKeyAuth;
