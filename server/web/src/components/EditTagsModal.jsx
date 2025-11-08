import React, { useState, useEffect } from 'react';
import './EditTagsModal.css';

function EditTagsModal({ isOpen, onClose, onSubmit, client }) {
  const [tags, setTags] = useState({});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (client && client.custom_tags) {
      setTags({ ...client.custom_tags });
    } else {
      setTags({});
    }
    setNewKey('');
    setNewValue('');
    setError('');
  }, [client]);

  const handleAddTag = () => {
    if (!newKey.trim()) {
      setError('Tag key cannot be empty');
      return;
    }

    setTags(prev => ({
      ...prev,
      [newKey.trim()]: newValue.trim()
    }));

    setNewKey('');
    setNewValue('');
    setError('');
  };

  const handleRemoveTag = (key) => {
    const updatedTags = { ...tags };
    delete updatedTags[key];
    setTags(updatedTags);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await onSubmit(client.id, tags);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update tags');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewKey('');
    setNewValue('');
    setError('');
    onClose();
  };

  if (!isOpen || !client) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content edit-tags-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Custom Tags</h2>
          <button className="close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="client-info">
            <strong>{client.name}</strong>
            {client.hostname && <span> ({client.hostname})</span>}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="tags-list">
              <h3>Current Tags</h3>
              {Object.keys(tags).length === 0 ? (
                <p className="no-tags">No tags defined</p>
              ) : (
                <div className="tags-container">
                  {Object.entries(tags).map(([key, value]) => (
                    <div key={key} className="tag-item">
                      <div className="tag-content">
                        <span className="tag-key">{key}:</span>
                        <span className="tag-value">{value}</span>
                      </div>
                      <button
                        type="button"
                        className="tag-remove-btn"
                        onClick={() => handleRemoveTag(key)}
                        disabled={submitting}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="add-tag-section">
              <h3>Add New Tag</h3>
              <div className="add-tag-form">
                <input
                  type="text"
                  placeholder="Key (e.g., location)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  disabled={submitting}
                />
                <input
                  type="text"
                  placeholder="Value (e.g., office)"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="btn-add-tag"
                  onClick={handleAddTag}
                  disabled={submitting || !newKey.trim()}
                >
                  + Add
                </button>
              </div>
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
                {submitting ? 'Saving...' : 'Save Tags'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditTagsModal;
