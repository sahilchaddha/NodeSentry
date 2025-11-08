# NodeSentry
## HomeLab Node Watcher

A lightweight monitoring solution for tracking nodes in your homelab environment. NodeSentry provides a simple API for clients to report their system information and a web interface to view all collected data.

## Features

- **REST API** for client data submission with API key authentication
- **Web Dashboard** with HTTP Basic Auth protection
- **Quick Links Management** - Add and manage frequently accessed links from the web interface
- **SQLite Database** for persistent data storage
- **Auto-refresh** dashboard to monitor nodes in real-time
- **Lightweight** - Built with Express.js and React

## Architecture

```
NodeSentry/
├── server/              # Backend server and web interface
│   ├── src/            # Server source code
│   │   ├── index.js    # Main Express server
│   │   ├── db/         # Database layer
│   │   ├── middleware/ # Authentication middleware
│   │   └── routes/     # API routes
│   ├── web/            # React web interface
│   └── data/           # SQLite database (auto-created)
└── client/             # Client applications (coming soon)
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NodeSentry
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your desired credentials
   ```

4. **Install and build web interface**
   ```bash
   cd web
   npm install
   npm run build
   cd ..
   ```

5. **Start the server**
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000` (or the port specified in `.env`)

## Configuration

Edit `server/.env` to configure the application:

```env
# Server Configuration
PORT=3000

# HTTP Basic Auth Credentials (for web interface and GET endpoint)
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=admin

# API Key for POST endpoint (clients use this to submit data)
API_KEY=test-api-key-12345

# Database
DB_PATH=./data/nodesentry.db
```

## API Documentation

### Authentication

- **POST endpoint**: Requires `X-API-Key` header with the configured API key
- **GET endpoint & Web UI**: Requires HTTP Basic Authentication

### Endpoints

#### POST /api/data

Submit client data to the server. If a client with the same name already exists, the record will be updated (UPSERT behavior) and the `last_updated` timestamp will be refreshed.

**Authentication**: API Key (via `X-API-Key` header)

**Behavior**:
- **New client**: Creates a new record with `created_at` and `last_updated` timestamps
- **Existing client**: Updates the existing record and refreshes `last_updated` timestamp

**Request Headers**:
```
Content-Type: application/json
X-API-Key: your-api-key-here
```

**Request Body**:
```json
{
  "name": "my-laptop",
  "local_ip": "192.168.1.100",
  "external_ip": "203.0.113.1",
  "mac_addresses": {
    "eth0": "00:1B:44:11:3A:B7",
    "wlan0": "00:1B:44:11:3A:B8"
  },
  "ifconfig_raw": "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n...",
  "hostname": "my-laptop.local",
  "custom_tags": {
    "location": "office",
    "os": "ubuntu",
    "version": "22.04"
  }
}
```

**Required Fields**:
- `name` (string): Client identifier

**Optional Fields**:
- `local_ip` (string): Local/private IP address
- `external_ip` (string): Public IP address
- `mac_addresses` (object): Key-value pairs of interface names and MAC addresses
- `ifconfig_raw` (string): Raw output from ifconfig/ipconfig command
- `hostname` (string): System hostname
- `custom_tags` (object): Any custom key-value pairs for categorization

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Data submitted successfully",
  "id": 1
}
```

**Error Responses**:
- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Missing API key
- `403 Forbidden`: Invalid API key
- `500 Internal Server Error`: Server error

**Example with curl**:
```bash
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key-12345" \
  -d '{
    "name": "my-laptop",
    "local_ip": "192.168.1.100",
    "hostname": "my-laptop.local",
    "custom_tags": {
      "location": "office"
    }
  }'
```

#### GET /api/data

Retrieve all stored client data.

**Authentication**: HTTP Basic Auth

**Response** (200 OK):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "name": "my-laptop",
      "local_ip": "192.168.1.100",
      "external_ip": "203.0.113.1",
      "mac_addresses": {
        "eth0": "00:1B:44:11:3A:B7"
      },
      "ifconfig_raw": "eth0: flags=4163...",
      "hostname": "my-laptop.local",
      "custom_tags": {
        "location": "office"
      },
      "created_at": "2024-01-15 10:30:45"
    }
  ]
}
```

**Example with curl**:
```bash
curl -X GET http://localhost:3000/api/data \
  -u admin:admin
```

#### GET /api/links

Retrieve all saved links.

**Authentication**: HTTP Basic Auth

**Response** (200 OK):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "name": "GitHub",
      "url": "https://github.com",
      "created_at": "2024-01-15 10:30:45"
    }
  ]
}
```

**Example with curl**:
```bash
curl -X GET http://localhost:3000/api/links \
  -u admin:admin
```

#### POST /api/links

Add a new link to the dashboard.

**Authentication**: HTTP Basic Auth

**Request Headers**:
```
Content-Type: application/json
Authorization: Basic <base64-encoded-credentials>
```

**Request Body**:
```json
{
  "name": "GitHub",
  "url": "https://github.com"
}
```

**Required Fields**:
- `name` (string): Display name for the link
- `url` (string): Valid URL (must include protocol like https://)

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Link added successfully",
  "id": 1
}
```

**Error Responses**:
- `400 Bad Request`: Missing required fields or invalid URL
- `401 Unauthorized`: Missing or invalid credentials
- `500 Internal Server Error`: Server error

**Example with curl**:
```bash
curl -X POST http://localhost:3000/api/links \
  -u admin:admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GitHub",
    "url": "https://github.com"
  }'
```

#### PATCH /api/data/:id/tags

Update custom tags for a specific client.

**Authentication**: HTTP Basic Auth

**URL Parameters**:
- `id` (integer): Client ID

**Request Headers**:
```
Content-Type: application/json
Authorization: Basic <base64-encoded-credentials>
```

**Request Body**:
```json
{
  "custom_tags": {
    "location": "datacenter",
    "environment": "production",
    "owner": "ops-team"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Custom tags updated successfully"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid client ID or custom_tags format
- `401 Unauthorized`: Missing or invalid credentials
- `404 Not Found`: Client not found
- `500 Internal Server Error`: Server error

**Example with curl**:
```bash
curl -X PATCH http://localhost:3000/api/data/1/tags \
  -u admin:admin \
  -H "Content-Type: application/json" \
  -d '{
    "custom_tags": {
      "location": "office",
      "environment": "dev"
    }
  }'
```

**Note**: Updating tags also refreshes the client's `last_updated` timestamp.

### Web Interface

Access the web dashboard at `http://localhost:3000/`

**Authentication**: HTTP Basic Auth (username and password from `.env`)

**Features**:
- **Quick Links** - Add and access frequently used links (dashboards, servers, services, etc.)
- **Client Status Monitoring** - Visual status indicators (Online/Warning/Offline) based on last update time
  - Online: Updated within last 5 minutes (green badge)
  - Warning: Updated 5-30 minutes ago (yellow badge)
  - Offline: No update for 30+ minutes (red badge)
- **Last Updated Tracking** - See when each client last reported in with human-readable time (e.g., "2 minutes ago")
- **Edit Custom Tags** - Click the edit button on any client to add, modify, or remove custom tags (location, environment, OS, etc.)
- View all client data in a sortable table
- Auto-refresh every 30 seconds (can be toggled)
- Manual refresh button
- Client count display
- Responsive design

## Development

### Server Development

Run the server in development mode with auto-reload:

```bash
cd server
npm run dev
```

### Web Interface Development

Run the React dev server with hot-reload:

```bash
cd server/web
npm run dev
```

This will start Vite dev server on `http://localhost:5173` with API proxy to the backend.

After making changes, rebuild the static files:

```bash
npm run build
```

## Database Schema

The SQLite database contains two tables:

### client_data Table

Stores information about monitored nodes/clients. The `name` field is unique, enabling UPSERT behavior when clients submit updates.

| Column          | Type    | Description                           |
|-----------------|---------|---------------------------------------|
| id              | INTEGER | Auto-incrementing primary key         |
| name            | TEXT    | Client name (required, unique)        |
| local_ip        | TEXT    | Local IP address                      |
| external_ip     | TEXT    | External/public IP address            |
| mac_addresses   | TEXT    | JSON string of MAC addresses          |
| ifconfig_raw    | TEXT    | Raw ifconfig output                   |
| hostname        | TEXT    | System hostname                       |
| custom_tags     | TEXT    | JSON string of custom tags            |
| created_at      | DATETIME| Timestamp when record was created     |
| last_updated    | DATETIME| Timestamp when record was last updated|

### links Table

Stores quick access links for the web dashboard.

| Column          | Type    | Description                           |
|-----------------|---------|---------------------------------------|
| id              | INTEGER | Auto-incrementing primary key         |
| name            | TEXT    | Display name for the link (required)  |
| url             | TEXT    | URL to link to (required)             |
| created_at      | DATETIME| Timestamp when link was created       |

## Security Considerations

1. **Change default credentials** in `.env` before deploying
2. **Use HTTPS** in production (consider using a reverse proxy like Nginx)
3. **Rotate API keys** periodically
4. **Restrict network access** to trusted clients only
5. **Database backups**: The SQLite database is stored in `server/data/`

## Troubleshooting

### Web interface shows 404

Make sure you've built the React app:
```bash
cd server/web
npm run build
```

### Authentication fails

Check that your credentials in `.env` match what you're using to authenticate.

### Database errors

Ensure the `data` directory has proper write permissions:
```bash
mkdir -p server/data
chmod 755 server/data
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
