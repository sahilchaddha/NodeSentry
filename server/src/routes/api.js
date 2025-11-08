const express = require('express');
const router = express.Router();
const basicAuth = require('../middleware/basicAuth');

/**
 * GET /api/data
 * Endpoint to retrieve all client data
 * Requires HTTP Basic Authentication
 *
 * Returns array of all client records with:
 * - id, name, local_ip, external_ip, mac_addresses
 * - ifconfig_raw, hostname, custom_tags, created_at
 */
router.get('/data', basicAuth, async (req, res) => {
  try {
    // Get database instance from app
    const db = req.app.get('db');

    // Fetch all client data
    const data = await db.getAllClientData();

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
