import React from 'react';
import { Icon } from './Icons';

export function RespondersView({
  responders = [],
  incidents = [],
  onSelectIncident,
  onUpdateResponderStatus
}) {
  const getStatusClass = (st) => {
    switch (st?.toLowerCase()) {
      case 'on scene':
        return 'badge-in-progress';
      case 'en route':
        return 'badge-pending';
      case 'available':
        return 'badge-resolved';
      default:
        return 'badge-rejected';
    }
  };

  return (
    <div className="responders-view-container">
      <div className="responders-header-row">
        <div>
          <h2 className="section-heading">Active Responders & Field Units</h2>
          <p className="feed-subheading">
            Tactical emergency teams linked via offline ad-hoc mesh radios. Telemetry received via peer relay nodes.
          </p>
        </div>
        <div className="live-mesh-tag">
          <span className="mesh-pulse-dot" /> {responders.length} Units Active
        </div>
      </div>

      <div className="responders-cards-grid">
        {responders.map((resp) => {
          const assignedIncident = incidents.find((i) => i.id === resp.assignedIncidentId);

          return (
            <div key={resp.id} className="responder-card">
              <div className="responder-card-top">
                <div className="responder-callsign-group">
                  <span className="resp-callsign font-mono">{resp.callsign}</span>
                  <span className={`status-badge ${getStatusClass(resp.status)} size-sm`}>
                    <span className="status-dot" />
                    {resp.status}
                  </span>
                </div>
                <div className="responder-node-pill font-mono">
                  <Icon name="radio" size={13} color="var(--teal-400)" />
                  {resp.meshNodeId}
                </div>
              </div>

              <h3 className="responder-name">{resp.name}</h3>
              <p className="responder-spec text-teal font-mono text-xs">{resp.specialization}</p>

              <div className="responder-telemetry-row">
                <div className="telemetry-item">
                  <Icon name="battery" size={14} color="var(--text-secondary)" />
                  <span className="font-mono text-xs">{resp.batteryPercent}% Battery</span>
                </div>
                <div className="telemetry-item">
                  <Icon name="radio" size={14} color="var(--text-secondary)" />
                  <span className="font-mono text-xs">{resp.signalQuality}</span>
                </div>
                <div className="telemetry-item">
                  <Icon name="users" size={14} color="var(--text-secondary)" />
                  <span className="font-mono text-xs">{resp.crewCount} Crew</span>
                </div>
              </div>

              <div className="responder-location-block">
                <div className="text-xs text-muted font-mono">CURRENT LOCATION / VECTOR:</div>
                <div className="resp-location-text">{resp.locationName}</div>
              </div>

              {/* Assignment block */}
              <div className="responder-assignment-box">
                <span className="text-xs text-muted font-mono">ASSIGNMENT:</span>
                {assignedIncident ? (
                  <div
                    className="assigned-incident-clickable"
                    onClick={() => onSelectIncident(assignedIncident.id)}
                    title="Click to view assigned incident"
                  >
                    <span className="assigned-id font-mono text-teal">{assignedIncident.id}</span>
                    <span className="assigned-title">{assignedIncident.title}</span>
                    <span className="assigned-arrow">→</span>
                  </div>
                ) : (
                  <span className="no-assignment text-muted text-xs">Standing by // Available for dispatch</span>
                )}
              </div>

              {/* Equipment list */}
              {resp.equipment && (
                <div className="responder-equipment">
                  <span className="text-xs text-muted font-mono">EQUIPMENT ONBOARD:</span>
                  <div className="equipment-chips">
                    {resp.equipment.map((item, idx) => (
                      <span key={idx} className="eq-chip font-mono text-xs">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Cycle Button */}
              <div className="responder-card-footer">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onUpdateResponderStatus && onUpdateResponderStatus(resp.id)}
                >
                  <Icon name="refreshCw" size={13} />
                  Cycle Status ({resp.status === 'Available' ? 'Dispatch to En Route' : resp.status === 'En Route' ? 'Mark On Scene' : 'Mark Available'})
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
