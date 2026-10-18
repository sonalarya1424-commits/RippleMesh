import React from 'react';
import { Icon } from './Icons';

export function SeverityBadge({ severity, showIcon = true, pulse = false }) {
  const sev = severity?.toLowerCase() || 'medium';

  const getStyleConfig = () => {
    switch (sev) {
      case 'critical':
        return {
          className: 'severity-critical',
          icon: 'alertTriangle',
          label: 'CRITICAL'
        };
      case 'high':
        return {
          className: 'severity-high',
          icon: 'alertTriangle',
          label: 'HIGH'
        };
      case 'medium':
        return {
          className: 'severity-medium',
          icon: 'shield',
          label: 'MEDIUM'
        };
      case 'low':
        return {
          className: 'severity-low',
          icon: 'shield',
          label: 'LOW'
        };
      default:
        return {
          className: 'severity-medium',
          icon: 'shield',
          label: severity?.toUpperCase() || 'NORMAL'
        };
    }
  };

  const config = getStyleConfig();
  const shouldPulse = pulse || sev === 'critical';

  return (
    <span className={`severity-badge ${config.className} ${shouldPulse ? 'severity-pulse' : ''}`}>
      {showIcon && <Icon name={config.icon} size={13} className="severity-icon" />}
      <span className="severity-label">{config.label}</span>
    </span>
  );
}
