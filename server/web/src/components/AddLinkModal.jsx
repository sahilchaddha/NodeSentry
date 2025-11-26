import React, { useState } from 'react';
import './AddLinkModal.css';

function AddLinkModal({ isOpen, onClose, onSubmit, clients = [] }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [clientName, setClientName] = useState('');
  const [icon, setIcon] = useState('🔗');
  const [groupName, setGroupName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      if (groupName.trim()) {
        linkData.group_name = groupName.trim();
      }

      // Add notes if provided
      if (notes.trim()) {
        linkData.notes = notes.trim();
      }

      await onSubmit(linkData);
      // Reset form
      setName('');
      setUrl('');
      setClientName('');
      setIcon('🔗');
      setGroupName('');
      setNotes('');
      setError('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setUrl('');
    setClientName('');
    setIcon('🔗');
    setGroupName('');
    setNotes('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Link</h2>
          <button className="close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="link-name">Name</label>
            <input
              type="text"
              id="link-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., GitHub"
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="link-url">URL</label>
            <input
              type="text"
              id="link-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g., https://github.com"
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="link-icon">
              Icon (Optional)
              <span className="field-hint"> - Paste an emoji</span>
            </label>
            <input
              type="text"
              id="link-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🔗"
              disabled={submitting}
              maxLength="4"
              style={{ fontSize: '24px' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="link-group">
              Group (Optional)
              <span className="field-hint"> - Organize links into groups</span>
            </label>
            <input
              type="text"
              id="link-group"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Development, Social, Work"
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="link-notes">
              Notes (Optional)
              <span className="field-hint"> - Add description or comments</span>
            </label>
            <textarea
              id="link-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., This is the production server dashboard"
              disabled={submitting}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="link-client">
              Client (Optional)
              <span className="field-hint"> - Leave empty for global link</span>
            </label>
            <select
              id="link-client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              disabled={submitting}
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
              className="btn-secondary"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddLinkModal;
