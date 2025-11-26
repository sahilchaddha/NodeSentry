import React, { useState, useMemo, useEffect } from 'react';
import './Links.css';

function Links({ links, onAddClick, onEditClick }) {
  const [filter, setFilter] = useState('all');
  const [linkStatuses, setLinkStatuses] = useState({});
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [checkingLinks, setCheckingLinks] = useState(new Set());

  // Get unique client names for filter dropdown
  const clientNames = useMemo(() => {
    const names = new Set();
    links.forEach(link => {
      if (link.client_name) {
        names.add(link.client_name);
      }
    });
    return Array.from(names).sort();
  }, [links]);

  // Filter links based on selected filter
  const filteredLinks = useMemo(() => {
    if (filter === 'all') {
      return links;
    } else if (filter === 'global') {
      return links.filter(link => !link.client_name);
    } else {
      return links.filter(link => link.client_name === filter);
    }
  }, [links, filter]);

  // Group links by group_name
  const groupedLinks = useMemo(() => {
    const groups = {};

    filteredLinks.forEach(link => {
      const groupName = link.group_name || 'Ungrouped';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(link);
    });

    return groups;
  }, [filteredLinks]);

  // Check status of a single link
  const checkLinkStatus = async (link) => {
    // Mark this link as being checked
    setCheckingLinks(prev => new Set(prev).add(link.id));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(link.url, {
        method: 'HEAD',
        mode: 'no-cors', // Avoid CORS issues
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      // Remove from checking set
      setCheckingLinks(prev => {
        const newSet = new Set(prev);
        newSet.delete(link.id);
        return newSet;
      });

      // With no-cors mode, we can't read the status, but if fetch succeeds, the URL is reachable
      return {
        id: link.id,
        url: link.url,
        ok: true,
        error: null
      };
    } catch (error) {
      // Remove from checking set
      setCheckingLinks(prev => {
        const newSet = new Set(prev);
        newSet.delete(link.id);
        return newSet;
      });

      // Check if it was aborted (timeout)
      if (error.name === 'AbortError') {
        return {
          id: link.id,
          url: link.url,
          ok: false,
          error: 'Timeout'
        };
      }

      // Network error or unreachable
      return {
        id: link.id,
        url: link.url,
        ok: false,
        error: error.message || 'Unreachable'
      };
    }
  };

  // Check status of all links
  const checkLinkStatuses = async () => {
    if (links.length === 0) return;

    setCheckingStatus(true);

    try {
      // Check all links in parallel
      const statusChecks = await Promise.all(
        links.map(link => checkLinkStatus(link))
      );

      const statusMap = {};
      statusChecks.forEach(status => {
        statusMap[status.id] = status;
      });
      setLinkStatuses(statusMap);
    } catch (error) {
      console.error('Error checking link statuses:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Check statuses on mount and when links change
  useEffect(() => {
    checkLinkStatuses();
  }, [links.length]); // Only re-check when number of links changes

  return (
    <div className="links-section">
      <div className="links-header">
        <h2>Quick Links</h2>
        <div className="links-controls">
          <select
            className="filter-dropdown"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Links ({links.length})</option>
            <option value="global">
              Global Links ({links.filter(l => !l.client_name).length})
            </option>
            {clientNames.map(name => (
              <option key={name} value={name}>
                {name} ({links.filter(l => l.client_name === name).length})
              </option>
            ))}
          </select>
          <button
            className="check-status-btn"
            onClick={checkLinkStatuses}
            disabled={checkingStatus || links.length === 0}
            title="Check link status"
          >
            {checkingStatus ? 'Checking...' : '🔄 Check Status'}
          </button>
          <button className="add-link-btn" onClick={onAddClick}>
            + Add Link
          </button>
        </div>
      </div>

      {filteredLinks.length === 0 ? (
        <div className="no-links">
          <p>No links {filter !== 'all' ? `for "${filter}"` : 'added yet'}.</p>
          <p className="hint">
            {filter !== 'all'
              ? 'Try selecting a different filter or add a new link.'
              : 'Click "Add Link" to create your first quick link.'}
          </p>
        </div>
      ) : (
        <div className="links-grouped-container">
          {Object.keys(groupedLinks).sort().map((groupName) => (
            <div key={groupName} className="links-group">
              <h3 className="group-header">{groupName}</h3>
              <div className="links-grid">
                {groupedLinks[groupName].map((link) => (
                  <div key={link.id} className="link-card-wrapper">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-card"
                    >
                      <div className="link-icon">
                        {link.icon ? (
                          <span className="link-icon-emoji">{link.icon}</span>
                        ) : (
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                        )}
                      </div>
                      <div className="link-info">
                        <div className="link-name-row">
                          {(checkingLinks.has(link.id) || linkStatuses[link.id]) && (
                            <span
                              className={`status-indicator ${
                                checkingLinks.has(link.id)
                                  ? 'status-checking'
                                  : linkStatuses[link.id].ok
                                  ? 'status-ok'
                                  : 'status-error'
                              }`}
                              title={
                                checkingLinks.has(link.id)
                                  ? 'Checking...'
                                  : linkStatuses[link.id].ok
                                  ? 'Online - URL is reachable'
                                  : `Offline: ${linkStatuses[link.id].error || 'Unreachable'}`
                              }
                            ></span>
                          )}
                          <h3 className="link-name">{link.name}</h3>
                          {link.notes && (
                            <span className="notes-indicator" title={link.notes}>
                              ℹ️
                            </span>
                          )}
                          {link.client_name ? (
                            <span className="client-badge">{link.client_name}</span>
                          ) : (
                            <span className="client-badge global-badge">Global</span>
                          )}
                        </div>
                        <p className="link-url">{link.url}</p>
                        {link.notes && (
                          <p className="link-notes">{link.notes}</p>
                        )}
                      </div>
                      <div className="link-arrow">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M7 17L17 7" />
                          <path d="M7 7h10v10" />
                        </svg>
                      </div>
                    </a>
                    <button
                      className="link-edit-btn"
                      onClick={() => onEditClick(link)}
                      title="Edit link"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Links;
