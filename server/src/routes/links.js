const express = require('express');
const router = express.Router();
const basicAuth = require('../middleware/basicAuth');

/**
 * GET /api/links
 * Endpoint to retrieve all links or filter by client
 * Requires HTTP Basic Authentication
 *
 * Query parameters:
 * - client_name: Filter links by client name (optional)
 *
 * Examples:
 * - GET /api/links - returns all links
 * - GET /api/links?client_name=my-laptop - returns links for specific client
 */
router.get('/links', basicAuth, async (req, res) => {
  try {
    const { client_name } = req.query;
    const db = req.app.get('db');

    let links;
    if (client_name) {
      // Filter by client name
      links = await db.getLinksByClientName(client_name);
    } else {
      // Get all links
      links = await db.getAllLinks();
    }

    res.json({
      success: true,
      count: links.length,
      data: links,
      filter: client_name ? { client_name } : null
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
 *   "url": "https://github.com",
 *   "client_name": "my-laptop" (optional),
 *   "notes": "Some notes about this link" (optional)
 * }
 */
router.post('/links', basicAuth, async (req, res) => {
  try {
    const { name, url, client_name, icon, group_name, notes } = req.body;

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

    // Resolve client_name to client_id if provided
    let client_id = null;
    if (client_name) {
      const clientData = await db.getClientDataByName(client_name);
      if (!clientData) {
        return res.status(404).json({
          error: 'Client not found',
          message: `No client found with name: ${client_name}`
        });
      }
      client_id = clientData.id;
    }

    const id = await db.insertLink({
      name,
      url,
      client_id,
      icon: icon || null,
      group_name: group_name || null,
      notes: notes || null
    });

    res.status(201).json({
      success: true,
      message: 'Link added successfully',
      id,
      client_name: client_name || null,
      icon: icon || null,
      group_name: group_name || null,
      notes: notes || null
    });
  } catch (error) {
    console.error('Error adding link:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PATCH /api/links/:id
 * Endpoint to update a link
 * Requires HTTP Basic Authentication
 *
 * Expected payload:
 * {
 *   "name": "Updated Name",
 *   "url": "https://updated-url.com",
 *   "client_name": "my-laptop" (optional - use null or empty string to make it global),
 *   "notes": "Updated notes" (optional)
 * }
 */
router.patch('/links/:id', basicAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, client_name, icon, group_name, notes } = req.body;

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

    // Resolve client_name to client_id if provided
    let client_id = null;
    if (client_name) {
      const clientData = await db.getClientDataByName(client_name);
      if (!clientData) {
        return res.status(404).json({
          error: 'Client not found',
          message: `No client found with name: ${client_name}`
        });
      }
      client_id = clientData.id;
    }

    const updated = await db.updateLink(id, {
      name,
      url,
      client_id,
      icon: icon !== undefined ? icon : undefined,
      group_name: group_name !== undefined ? group_name : undefined,
      notes: notes !== undefined ? notes : undefined
    });

    if (!updated) {
      return res.status(404).json({
        error: 'Link not found',
        message: `No link found with ID: ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Link updated successfully',
      id: parseInt(id),
      client_name: client_name || null,
      icon: icon || null,
      group_name: group_name || null,
      notes: notes !== undefined ? notes : null
    });
  } catch (error) {
    console.error('Error updating link:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/links/:id
 * Endpoint to delete a link
 * Requires HTTP Basic Authentication
 */
router.delete('/links/:id', basicAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.get('db');

    const deleted = await db.deleteLink(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Link not found',
        message: `No link found with ID: ${id}`
      });
    }

    res.json({
      success: true,
      message: 'Link deleted successfully',
      id: parseInt(id)
    });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
