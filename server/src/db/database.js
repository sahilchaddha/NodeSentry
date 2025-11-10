const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor(dbPath) {
    this.dbPath = dbPath || process.env.DB_PATH || './data/nodesentry.db';
    this.db = null;
  }

  /**
   * Initialize database connection and create tables if they don't exist
   */
  async init() {
    return new Promise((resolve, reject) => {
      // Ensure data directory exists
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database at:', this.dbPath);
          this.createTables()
            .then(resolve)
            .catch(reject);
        }
      });
    });
  }

  /**
   * Create tables if they don't exist
   */
  async createTables() {
    const createClientDataTableSQL = `
      CREATE TABLE IF NOT EXISTS client_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        local_ip TEXT,
        external_ip TEXT,
        mac_addresses TEXT,
        ifconfig_raw TEXT,
        hostname TEXT,
        custom_tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createLinksTableSQL = `
      CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        client_id INTEGER,
        icon TEXT,
        group_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES client_data(id) ON DELETE CASCADE
      )
    `;

    return new Promise((resolve, reject) => {
      this.db.run(createClientDataTableSQL, (err) => {
        if (err) {
          console.error('Error creating client_data table:', err);
          reject(err);
        } else {
          // Check if we need to migrate existing table
          this.db.get("PRAGMA table_info(client_data)", [], (err, row) => {
            if (err) {
              console.error('Error checking table schema:', err);
            }

            // Check if last_updated column exists
            this.db.all("PRAGMA table_info(client_data)", [], (err, columns) => {
              if (err) {
                console.error('Error getting column info:', err);
                reject(err);
                return;
              }

              const hasLastUpdated = columns.some(col => col.name === 'last_updated');

              const migrateColumn = () => {
                if (!hasLastUpdated) {
                  console.log('Migrating database: Adding last_updated column...');
                  this.db.run('ALTER TABLE client_data ADD COLUMN last_updated DATETIME DEFAULT CURRENT_TIMESTAMP', (err) => {
                    if (err) {
                      console.error('Error adding last_updated column:', err);
                      reject(err);
                      return;
                    }
                    // Update existing records to have last_updated = created_at
                    this.db.run('UPDATE client_data SET last_updated = created_at WHERE last_updated IS NULL', (err) => {
                      if (err) {
                        console.error('Error updating last_updated for existing records:', err);
                      }
                      console.log('Migration complete: last_updated column added');
                      addUniqueIndex();
                    });
                  });
                } else {
                  addUniqueIndex();
                }
              };

              const addUniqueIndex = () => {
                // Create a unique index on name if it doesn't exist (for UPSERT support)
                this.db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_client_name ON client_data(name)', (err) => {
                  if (err) {
                    console.error('Error creating unique index on name:', err);
                  } else {
                    console.log('Unique index on client name ensured');
                  }
                  this.createLinksTable(createLinksTableSQL, resolve, reject);
                });
              };

              migrateColumn();
            });
          });
        }
      });
    });
  }

  /**
   * Helper to create links table
   */
  createLinksTable(createLinksTableSQL, resolve, reject) {
    this.db.run(createLinksTableSQL, (err) => {
      if (err) {
        console.error('Error creating links table:', err);
        reject(err);
      } else {
        // Check if we need to migrate existing links table
        this.db.all("PRAGMA table_info(links)", [], (err, columns) => {
          if (err) {
            console.error('Error getting links table column info:', err);
            reject(err);
            return;
          }

          const hasClientId = columns.some(col => col.name === 'client_id');
          const hasIcon = columns.some(col => col.name === 'icon');
          const hasGroupName = columns.some(col => col.name === 'group_name');

          const migrations = [];

          if (!hasClientId) {
            migrations.push({
              name: 'client_id',
              sql: 'ALTER TABLE links ADD COLUMN client_id INTEGER'
            });
          }

          if (!hasIcon) {
            migrations.push({
              name: 'icon',
              sql: 'ALTER TABLE links ADD COLUMN icon TEXT'
            });
          }

          if (!hasGroupName) {
            migrations.push({
              name: 'group_name',
              sql: 'ALTER TABLE links ADD COLUMN group_name TEXT'
            });
          }

          this.runLinksMigrations(migrations, 0, resolve, reject);
        });
      }
    });
  }

  /**
   * Helper to run migrations sequentially
   */
  runLinksMigrations(migrations, index, resolve, reject) {
    if (index >= migrations.length) {
      this.addLinksIndexes(resolve, reject);
      return;
    }

    const migration = migrations[index];
    console.log(`Migrating database: Adding ${migration.name} column to links table...`);

    this.db.run(migration.sql, (err) => {
      if (err) {
        console.error(`Error adding ${migration.name} column:`, err);
        reject(err);
        return;
      }
      console.log(`Migration complete: ${migration.name} column added to links table`);
      this.runLinksMigrations(migrations, index + 1, resolve, reject);
    });
  }

  /**
   * Helper to add indexes for links table
   */
  addLinksIndexes(resolve, reject) {
    // Create an index on client_id for faster lookups
    this.db.run('CREATE INDEX IF NOT EXISTS idx_links_client_id ON links(client_id)', (err) => {
      if (err) {
        console.error('Error creating index on client_id:', err);
      } else {
        console.log('Index on links.client_id ensured');
      }
      console.log('Database tables initialized');
      resolve();
    });
  }

  /**
   * Insert or update client data (UPSERT pattern)
   * If a client with the same name exists, updates the record and last_updated timestamp
   * @param {Object} data - Client data object
   * @returns {Promise<number>} - ID of inserted/updated row
   */
  insertClientData(data) {
    const sql = `
      INSERT INTO client_data
      (name, local_ip, external_ip, mac_addresses, ifconfig_raw, hostname, custom_tags, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(name) DO UPDATE SET
        local_ip = excluded.local_ip,
        external_ip = excluded.external_ip,
        mac_addresses = excluded.mac_addresses,
        ifconfig_raw = excluded.ifconfig_raw,
        hostname = excluded.hostname,
        custom_tags = excluded.custom_tags,
        last_updated = CURRENT_TIMESTAMP
    `;

    const params = [
      data.name,
      data.local_ip || null,
      data.external_ip || null,
      JSON.stringify(data.mac_addresses || {}),
      data.ifconfig_raw || null,
      data.hostname || null,
      JSON.stringify(data.custom_tags || {})
    ];

    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error inserting/updating data:', err);
          reject(err);
        } else {
          // For INSERT, this.lastID is the new ID
          // For UPDATE, we need to fetch the ID
          resolve(this.lastID || this.changes);
        }
      });
    });
  }

  /**
   * Get all client data
   * @returns {Promise<Array>} - Array of all client records
   */
  getAllClientData() {
    const sql = 'SELECT * FROM client_data ORDER BY last_updated DESC';

    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error fetching data:', err);
          reject(err);
        } else {
          // Parse JSON fields
          const parsedRows = rows.map(row => ({
            ...row,
            mac_addresses: JSON.parse(row.mac_addresses || '{}'),
            custom_tags: JSON.parse(row.custom_tags || '{}')
          }));
          resolve(parsedRows);
        }
      });
    });
  }

  /**
   * Get client data by name
   * @param {string} name - Client name
   * @returns {Promise<Object|null>} - Client record or null if not found
   */
  getClientDataByName(name) {
    const sql = 'SELECT * FROM client_data WHERE name = ?';

    return new Promise((resolve, reject) => {
      this.db.get(sql, [name], (err, row) => {
        if (err) {
          console.error('Error fetching client by name:', err);
          reject(err);
        } else if (row) {
          // Parse JSON fields
          const parsedRow = {
            ...row,
            mac_addresses: JSON.parse(row.mac_addresses || '{}'),
            custom_tags: JSON.parse(row.custom_tags || '{}')
          };
          resolve(parsedRow);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Update custom tags for a client
   * @param {number} id - Client ID
   * @param {Object} customTags - New custom tags object
   * @returns {Promise<boolean>} - Success status
   */
  updateCustomTags(id, customTags) {
    const sql = `
      UPDATE client_data
      SET custom_tags = ?, last_updated = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [JSON.stringify(customTags || {}), id];

    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error updating custom tags:', err);
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  /**
   * Insert new link
   * @param {Object} link - Link object with name, url, optional client_id, icon, and group_name
   * @returns {Promise<number>} - ID of inserted row
   */
  insertLink(link) {
    const sql = `
      INSERT INTO links (name, url, client_id, icon, group_name)
      VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      link.name,
      link.url,
      link.client_id || null,
      link.icon || null,
      link.group_name || null
    ];

    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error inserting link:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Get all links with client information
   * @returns {Promise<Array>} - Array of all link records with client info
   */
  getAllLinks() {
    const sql = `
      SELECT
        links.*,
        client_data.name as client_name
      FROM links
      LEFT JOIN client_data ON links.client_id = client_data.id
      ORDER BY links.created_at DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error fetching links:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Get links by client ID
   * @param {number} clientId - Client ID
   * @returns {Promise<Array>} - Array of link records for the client
   */
  getLinksByClientId(clientId) {
    const sql = `
      SELECT
        links.*,
        client_data.name as client_name
      FROM links
      LEFT JOIN client_data ON links.client_id = client_data.id
      WHERE links.client_id = ?
      ORDER BY links.created_at DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [clientId], (err, rows) => {
        if (err) {
          console.error('Error fetching links by client ID:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Get links by client name
   * @param {string} clientName - Client name
   * @returns {Promise<Array>} - Array of link records for the client
   */
  getLinksByClientName(clientName) {
    const sql = `
      SELECT
        links.*,
        client_data.name as client_name
      FROM links
      INNER JOIN client_data ON links.client_id = client_data.id
      WHERE client_data.name = ?
      ORDER BY links.created_at DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [clientName], (err, rows) => {
        if (err) {
          console.error('Error fetching links by client name:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Update a link
   * @param {number} id - Link ID
   * @param {Object} linkData - Link data to update (name, url, client_id, icon, group_name)
   * @returns {Promise<boolean>} - Success status
   */
  updateLink(id, linkData) {
    const sql = `
      UPDATE links
      SET name = ?, url = ?, client_id = ?, icon = ?, group_name = ?
      WHERE id = ?
    `;

    const params = [
      linkData.name,
      linkData.url,
      linkData.client_id !== undefined ? linkData.client_id : null,
      linkData.icon !== undefined ? linkData.icon : null,
      linkData.group_name !== undefined ? linkData.group_name : null,
      id
    ];

    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error updating link:', err);
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  /**
   * Delete a link
   * @param {number} id - Link ID
   * @returns {Promise<boolean>} - Success status
   */
  deleteLink(id) {
    const sql = 'DELETE FROM links WHERE id = ?';

    return new Promise((resolve, reject) => {
      this.db.run(sql, [id], function(err) {
        if (err) {
          console.error('Error deleting link:', err);
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  /**
   * Close database connection
   */
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = Database;
