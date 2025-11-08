import React from 'react';
import './DataTable.css';

function DataTable({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <p>No client data available yet.</p>
        <p className="hint">Waiting for clients to submit data...</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
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
    const last = new Date(lastUpdated);
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
            <th>MAC Addresses</th>
            <th>Custom Tags</th>
            <th>Ifconfig Raw</th>
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
                <td>{item.local_ip || '-'}</td>
                <td>{item.external_ip || '-'}</td>
                <td className="json-cell">{formatJSON(item.mac_addresses)}</td>
                <td className="json-cell">{formatJSON(item.custom_tags)}</td>
                <td className="code-cell">
                  {item.ifconfig_raw ? (
                    <pre className="ifconfig-preview">{item.ifconfig_raw}</pre>
                  ) : '-'}
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
