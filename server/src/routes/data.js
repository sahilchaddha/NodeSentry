const express = require('express');
const router = express.Router();
const apiKeyAuth = require('../middleware/apiKeyAuth');

/**
 * POST /api/data
 * Endpoint for clients to submit their data
 * Requires API key authentication via X-API-Key header
 *
 * Expected payload:
 * {
 *   "name": "client-name",
 *   "local_ip": "192.168.1.100",
 *   "external_ip": "203.0.113.1" (optional),
 *   "mac_addresses": { "eth0": "00:1B:44:11:3A:B7" },
 *   "ifconfig_raw": "raw ifconfig output",
 *   "hostname": "my-laptop",
 *   "custom_tags": { "location": "office", "os": "ubuntu" }
 * }
 */
router.post('/data', apiKeyAuth, async (req, res) => {
  try {
    const {
      name,
      local_ip,
      external_ip,
      mac_addresses,
      ifconfig_raw,
      hostname,
      custom_tags
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: 'Missing required field: name'
      });
    }

    // Get database instance from app
    const db = req.app.get('db');

    // Insert data into database
    const id = await db.insertClientData({
      name,
      local_ip,
      external_ip,
      mac_addresses,
      ifconfig_raw,
      hostname,
      custom_tags
    });

    res.status(201).json({
      success: true,
      message: 'Data submitted successfully',
      id
    });
  } catch (error) {
    console.error('Error processing data submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
