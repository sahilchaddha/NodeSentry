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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
        console.log('Database tables initialized');
        resolve();
      }
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
   * Insert new link
   * @param {Object} link - Link object with name and url
   * @returns {Promise<number>} - ID of inserted row
   */
  insertLink(link) {
    const sql = `
      INSERT INTO links (name, url)
      VALUES (?, ?)
    `;

    const params = [link.name, link.url];

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
   * Get all links
   * @returns {Promise<Array>} - Array of all link records
   */
  getAllLinks() {
    const sql = 'SELECT * FROM links ORDER BY created_at DESC';

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
