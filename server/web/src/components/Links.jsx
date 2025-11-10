import React, { useState, useMemo } from 'react';
import './Links.css';

function Links({ links, onAddClick, onEditClick }) {
  const [filter, setFilter] = useState('all');

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
                          <h3 className="link-name">{link.name}</h3>
                          {link.client_name ? (
                            <span className="client-badge">{link.client_name}</span>
                          ) : (
                            <span className="client-badge global-badge">Global</span>
                          )}
                        </div>
                        <p className="link-url">{link.url}</p>
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
