const express = require('express');
const router = express.Router();
const basicAuth = require('../middleware/basicAuth');

/**
 * GET /api/links
 * Endpoint to retrieve all links
 * Requires HTTP Basic Authentication
 */
router.get('/links', basicAuth, async (req, res) => {
  try {
    const db = req.app.get('db');
    const links = await db.getAllLinks();

    res.json({
      success: true,
      count: links.length,
      data: links
    });
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/links
 * Endpoint to add a new link
 * Requires HTTP Basic Authentication
 *
 * Expected payload:
 * {
 *   "name": "GitHub",
 *   "url": "https://github.com"
 * }
 */
router.post('/links', basicAuth, async (req, res) => {
  try {
    const { name, url } = req.body;

    // Validate required fields
    if (!name || !url) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Both name and url are required'
      });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (err) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Please provide a valid URL'
      });
    }

    const db = req.app.get('db');
    const id = await db.insertLink({ name, url });

    res.status(201).json({
      success: true,
      message: 'Link added successfully',
      id
    });
  } catch (error) {
    console.error('Error adding link:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
