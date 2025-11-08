import React, { useState } from 'react';
import './AddLinkModal.css';

function AddLinkModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
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
      await onSubmit({ name: name.trim(), url: url.trim() });
      // Reset form
      setName('');
      setUrl('');
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
