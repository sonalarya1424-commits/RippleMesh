import React from 'react';

export function StatusBadge({ status, size = 'md' }) {
  const getStatusClass = (st) => {
    switch (st?.toLowerCase()) {
      case 'pending review':
      case 'pending':
        return 'badge-pending';
      case 'approved':
        return 'badge-approved';
      case 'in progress':
        return 'badge-in-progress';
      case 'resolved':
        return 'badge-resolved';
      case 'rejected':
        return 'badge-rejected';
      default:
        return 'badge-default';
    }
  };

  const getDotColor = (st) => {
    switch (st?.toLowerCase()) {
      case 'pending review':
      case 'pending':
        return 'var(--status-pending)';
      case 'approved':
        return 'var(--status-approved)';
      case 'in progress':
        return 'var(--status-in-progress)';
      case 'resolved':
        return 'var(--status-resolved)';
      case 'rejected':
        return 'var(--status-rejected)';
      default:
        return 'var(--text-muted)';
    }
  };

  return (
    <span className={`status-badge ${getStatusClass(status)} size-${size}`}>
      <span className="status-dot" style={{ backgroundColor: getDotColor(status) }} />
      {status || 'Unknown'}
    </span>
  );
}
