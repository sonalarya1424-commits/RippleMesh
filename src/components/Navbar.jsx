import React from 'react';
import { Icon } from './Icons';

export function Navbar({ onSimulateDistress, onResetData, currentView }) {
  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Coordinator Overview & Tactical Mesh Map';
      case 'incidents':
        return 'Incident Triage & Review Queue';
      case 'activity':
        return 'Autonomous Multi-Agent Audit Log';
      case 'responders':
        return 'Field Response Units & Equipment Telemetry';
      default:
        return 'Coordinator Dashboard';
    }
  };

  return (
    <header className="app-navbar">
      <div className="navbar-left">
        <div className="navbar-view-info">
          <span className="navbar-breadcrumb font-mono text-xs text-muted">
            RIPPLEMESH // OPERATOR CONSOLE //
          </span>
          <h2 className="navbar-title">{getViewTitle()}</h2>
        </div>
      </div>

      <div className="navbar-right">
        {/* Offline Mesh Status Pill */}
        <div className="status-banner-pill offline-mesh-pill" title="System designed to operate when cloud connectivity is unavailable">
          <Icon name="offline" size={14} color="var(--teal-400)" />
          <span className="pill-text font-mono">OFFLINE MESH ACTIVE</span>
          <span className="radar-dot" />
        </div>

        {/* Local Hackathon Simulation Badge */}
        <div className="status-banner-pill demo-sim-pill" title="Running in simulated offline mode for hackathon frontend evaluation">
          <span className="sim-dot" />
          <span className="pill-text font-mono">DEMO SIMULATION • NO BACKEND CONNECTED</span>
        </div>

        {/* Action Buttons */}
        <button
          className="btn btn-outline btn-sm"
          onClick={onSimulateDistress}
          title="Simulate receiving a new mesh distress packet"
        >
          <Icon name="sparkles" size={14} color="var(--teal-400)" />
          + Simulate Distress Burst
        </button>

        <button
          className="btn btn-icon-only"
          onClick={onResetData}
          title="Reset to initial mock dataset"
          aria-label="Reset Mock Data"
        >
          <Icon name="activity" size={15} />
        </button>
      </div>
    </header>
  );
}
