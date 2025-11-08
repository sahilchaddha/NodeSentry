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

/**
 * PATCH /api/data/:id/tags
 * Endpoint to update custom tags for a client
 * Requires HTTP Basic Authentication
 *
 * Expected payload:
 * {
 *   "custom_tags": { "key": "value", ... }
 * }
 */
router.patch('/data/:id/tags', basicAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { custom_tags } = req.body;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: 'Invalid client ID'
      });
    }

    // Validate custom_tags
    if (custom_tags === undefined || typeof custom_tags !== 'object') {
      return res.status(400).json({
        error: 'Invalid custom_tags format',
        message: 'custom_tags must be an object'
      });
    }

    const db = req.app.get('db');
    const success = await db.updateCustomTags(parseInt(id), custom_tags);

    if (!success) {
      return res.status(404).json({
        error: 'Client not found',
        message: `No client found with ID ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Custom tags updated successfully'
    });
  } catch (error) {
    console.error('Error updating custom tags:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
