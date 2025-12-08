const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const Database = require('./db/database');
const basicAuth = require('./middleware/basicAuth');
const sessionAuth = require('./middleware/sessionAuth');
const apiWithSession = require('./middleware/apiWithSession');

// Import routes
const authRoute = require('./routes/auth');
const dataRoute = require('./routes/data');
const apiRoute = require('./routes/api');
const linksRoute = require('./routes/links');

// Load environment variables
require('dotenv').config();

// Validate required environment variables
if (!process.env.SESSION_SECRET) {
  console.error('ERROR: SESSION_SECRET is not set in .env file');
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: './data'
  }),
  secret: process.env.SESSION_SECRET,
  name: 'nodesentry.sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Database initialization
let db;

async function initializeDatabase() {
  db = new Database();
  await db.init();
  app.set('db', db);
}

// API Routes
// Auth routes (no protection needed)
app.use('/api/auth', authRoute);

// Data routes (POST /api/data uses apiKeyAuth, GET uses apiWithSession)
app.use('/api', dataRoute);

// API routes with session authentication
app.use('/api', apiWithSession, apiRoute);
app.use('/api', apiWithSession, linksRoute);

// Serve static files from web/build (React app handles its own auth check)
const staticPath = path.join(__dirname, '../web/build');
app.use('/', express.static(staticPath));

// Fallback for React Router (SPA support)
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({
        error: 'Web interface not built yet',
        message: 'Please run npm run build in the web directory'
      });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`NodeSentry Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(50));
      console.log(`API Endpoints:`);
      console.log(`  POST http://localhost:${PORT}/api/data (API Key required)`);
      console.log(`  GET  http://localhost:${PORT}/api/data (Session Auth required)`);
      console.log(`Web Interface:`);
      console.log(`  http://localhost:${PORT}/ (Session Auth - Login page)`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  if (db) {
    await db.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  if (db) {
    await db.close();
  }
  process.exit(0);
});

startServer();
