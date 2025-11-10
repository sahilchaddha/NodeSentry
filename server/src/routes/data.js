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

/**
 * GET /api/data/:name
 * Endpoint to retrieve data for a specific client by name
 * Requires API key authentication via X-API-Key header
 *
 * Example: GET /api/data/my-laptop
 */
router.get('/data/:name', apiKeyAuth, async (req, res) => {
  try {
    const { name } = req.params;

    // Get database instance from app
    const db = req.app.get('db');

    // Fetch client data by name
    const clientData = await db.getClientDataByName(name);

    if (!clientData) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    res.status(200).json({
      success: true,
      data: clientData
    });
  } catch (error) {
    console.error('Error retrieving client data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/data/:name/links
 * Endpoint to retrieve all links for a specific client by name
 * Requires API key authentication via X-API-Key header
 *
 * Example: GET /api/data/my-laptop/links
 */
router.get('/data/:name/links', apiKeyAuth, async (req, res) => {
  try {
    const { name } = req.params;

    // Get database instance from app
    const db = req.app.get('db');

    // First verify the client exists
    const clientData = await db.getClientDataByName(name);

    if (!clientData) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    // Fetch links for the client
    const links = await db.getLinksByClientName(name);

    res.status(200).json({
      success: true,
      count: links.length,
      client_name: name,
      data: links
    });
  } catch (error) {
    console.error('Error retrieving client links:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
