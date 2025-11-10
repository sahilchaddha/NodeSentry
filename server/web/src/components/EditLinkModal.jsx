import React, { useState, useEffect } from 'react';
import './AddLinkModal.css';

function EditLinkModal({ isOpen, onClose, onSubmit, onDelete, link, clients = [] }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [clientName, setClientName] = useState('');
  const [icon, setIcon] = useState('🔗');
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Populate form when link changes
  useEffect(() => {
    if (link) {
      setName(link.name || '');
      setUrl(link.url || '');
      setClientName(link.client_name || '');
      setIcon(link.icon || '🔗');
      setGroupName(link.group_name || '');
    }
  }, [link]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim() || !url.trim()) {
      setError('Both name and URL are required');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (err) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setSubmitting(true);

    try {
      const linkData = {
        name: name.trim(),
        url: url.trim()
      };

      // Only add client_name if it's selected (not empty string)
      if (clientName) {
        linkData.client_name = clientName;
      }

      // Add icon if provided
      if (icon) {
        linkData.icon = icon.trim();
      }

      // Add group_name if provided
      if (groupName) {
        linkData.group_name = groupName.trim();
      }

      await onSubmit(link.id, linkData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${link.name}"?`)) {
      return;
    }

    setDeleting(true);

    try {
      await onDelete(link.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete link');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!isOpen || !link) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Link</h2>
          <button className="close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="edit-link-name">Name</label>
            <input
              type="text"
              id="edit-link-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., GitHub"
              disabled={submitting || deleting}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-link-url">URL</label>
            <input
              type="text"
              id="edit-link-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g., https://github.com"
              disabled={submitting || deleting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-link-icon">
              Icon (Optional)
              <span className="field-hint"> - Paste an emoji</span>
            </label>
            <input
              type="text"
              id="edit-link-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🔗"
              disabled={submitting || deleting}
              maxLength="4"
              style={{ fontSize: '24px' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-link-group">
              Group (Optional)
              <span className="field-hint"> - Organize links into groups</span>
            </label>
            <input
              type="text"
              id="edit-link-group"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Development, Social, Work"
              disabled={submitting || deleting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-link-client">
              Client (Optional)
              <span className="field-hint"> - Leave empty for global link</span>
            </label>
            <select
              id="edit-link-client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              disabled={submitting || deleting}
            >
              <option value="">None (Global Link)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.name}>
                  {client.name} - {client.hostname || 'No hostname'}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-danger"
              onClick={handleDelete}
              disabled={submitting || deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <div style={{ flex: 1 }}></div>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={submitting || deleting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || deleting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditLinkModal;
