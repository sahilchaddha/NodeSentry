import React from 'react';
import './DataTable.css';

function DataTable({ data, onEditTags }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <p>No client data available yet.</p>
        <p className="hint">Waiting for clients to submit data...</p>
      </div>
    );
  }

  const parseDateTime = (dateString) => {
    // SQLite stores timestamps as "YYYY-MM-DD HH:MM:SS"
    // We need to explicitly treat this as UTC and convert to local time
    if (!dateString) return new Date();

    // If the string doesn't have timezone info, SQLite returns UTC
    // Add 'Z' to explicitly mark it as UTC if not already present
    if (!dateString.includes('Z') && !dateString.includes('+')) {
      // SQLite format: "2024-01-15 10:30:45"
      // Convert to ISO format and add Z for UTC
      const isoString = dateString.replace(' ', 'T') + 'Z';
      return new Date(isoString);
    }

    return new Date(dateString);
  };

  const formatDate = (dateString) => {
    const date = parseDateTime(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = parseDateTime(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const getClientStatus = (lastUpdated) => {
    const now = new Date();
    const last = parseDateTime(lastUpdated);
    const diffMins = Math.floor((now - last) / 60000);

    if (diffMins < 5) return 'online';
    if (diffMins < 30) return 'warning';
    return 'offline';
  };

  const formatJSON = (jsonData) => {
    if (!jsonData || Object.keys(jsonData).length === 0) {
      return '-';
    }
    return (
      <pre className="json-preview">
        {JSON.stringify(jsonData, null, 2)}
      </pre>
    );
  };

  const formatIPArray = (ipArray) => {
    if (!ipArray || !Array.isArray(ipArray) || ipArray.length === 0) {
      return '-';
    }
    return (
      <div className="ip-list">
        {ipArray.map((ip, index) => (
          <div key={index} className="ip-item">{ip}</div>
        ))}
      </div>
    );
  };

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>ID</th>
            <th>Name</th>
            <th>Hostname</th>
            <th>Local IP</th>
            <th>External IP</th>
            <th>Custom Tags</th>
            <th>Last Updated</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const status = getClientStatus(item.last_updated || item.created_at);
            return (
              <tr key={item.id} className={`row-${status}`}>
                <td>
                  <span className={`status-badge status-${status}`}>
                    {status === 'online' && '● Online'}
                    {status === 'warning' && '● Warning'}
                    {status === 'offline' && '● Offline'}
                  </span>
                </td>
                <td>{item.id}</td>
                <td className="text-bold">{item.name}</td>
                <td>{item.hostname || '-'}</td>
                <td>{formatIPArray(item.local_ip)}</td>
                <td>{item.external_ip || '-'}</td>
                <td className="tags-cell">
                  <div className="tags-cell-content">
                    <div className="tags-display">
                      {Object.keys(item.custom_tags || {}).length === 0 ? (
                        <span className="no-tags-text">-</span>
                      ) : (
                        formatJSON(item.custom_tags)
                      )}
                    </div>
                    <button
                      className="edit-tags-btn"
                      onClick={() => onEditTags(item)}
                      title="Edit tags"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="time-cell">
                  <div className="time-display">
                    <span className="time-ago">{getTimeAgo(item.last_updated || item.created_at)}</span>
                    <span className="time-full">{formatDate(item.last_updated || item.created_at)}</span>
                  </div>
                </td>
                <td>{formatDate(item.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
