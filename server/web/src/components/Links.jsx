import React from 'react';
import './Links.css';

function Links({ links, onAddClick }) {
  return (
    <div className="links-section">
      <div className="links-header">
        <h2>Quick Links</h2>
        <button className="add-link-btn" onClick={onAddClick}>
          + Add Link
        </button>
      </div>

      {links.length === 0 ? (
        <div className="no-links">
          <p>No links added yet.</p>
          <p className="hint">Click "Add Link" to create your first quick link.</p>
        </div>
      ) : (
        <div className="links-grid">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-card"
            >
              <div className="link-icon">
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
              </div>
              <div className="link-info">
                <h3 className="link-name">{link.name}</h3>
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
          ))}
        </div>
      )}
    </div>
  );
}

export default Links;
