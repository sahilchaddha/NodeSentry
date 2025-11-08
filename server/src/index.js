const express = require('express');
const path = require('path');
const Database = require('./db/database');
const basicAuth = require('./middleware/basicAuth');

// Import routes
const dataRoute = require('./routes/data');
const apiRoute = require('./routes/api');
const linksRoute = require('./routes/links');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api', dataRoute);
app.use('/api', apiRoute);
app.use('/api', linksRoute);

// Serve static files from web/build (with Basic Auth protection)
const staticPath = path.join(__dirname, '../web/build');
app.use('/', basicAuth, express.static(staticPath));

// Fallback for React Router (SPA support)
app.get('*', basicAuth, (req, res) => {
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
      console.log(`  GET  http://localhost:${PORT}/api/data (Basic Auth required)`);
      console.log(`Web Interface:`);
      console.log(`  http://localhost:${PORT}/ (Basic Auth required)`);
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
