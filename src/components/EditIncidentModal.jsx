import React, { useState, useEffect } from 'react';
import { Icon } from './Icons';

export function EditIncidentModal({ incident, isOpen, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState('Critical');
  const [status, setStatus] = useState('Pending Review');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (incident) {
      setTitle(incident.title || '');
      setSeverity(incident.severity || 'Critical');
      setStatus(incident.status || 'Pending Review');
      setSummary(incident.summary || '');
      setError('');
    }
  }, [incident, isOpen]);

  if (!isOpen || !incident) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Incident title is required.');
      return;
    }
    if (!summary.trim()) {
      setError('Report summary cannot be empty.');
      return;
    }

    onSave({
      ...incident,
      title: title.trim(),
      severity,
      status,
      summary: summary.trim()
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="font-mono text-teal text-sm">{incident.id}</span>
            <h3 className="modal-heading">Edit Incident Record</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <Icon name="cross" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="modal-error-box font-mono text-xs">
              <Icon name="alertTriangle" size={14} color="var(--critical)" />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Incident Title</label>
            <input
              type="text"
              className="text-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Descriptive incident title"
            />
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Triage Severity</label>
              <select
                className="filter-select"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="Critical">Critical (Immediate Hazard)</option>
                <option value="High">High (Urgent Risk)</option>
                <option value="Medium">Medium (Moderate Impact)</option>
                <option value="Low">Low (Informational / Minor)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Operational Status</label>
              <select
                className="filter-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Pending Review">Pending Review</option>
                <option value="Approved">Approved</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Incident Summary & Field Notes</label>
            <textarea
              className="text-area-input"
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Detailed report summary from field..."
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Icon name="check" size={14} />
              Save Operational Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
