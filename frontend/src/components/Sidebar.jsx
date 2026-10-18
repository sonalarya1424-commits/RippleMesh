import React from 'react';
import { Icon } from './Icons';

export function Sidebar({ currentView, onSelectView, pendingCount = 0 }) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      badge: null
    },
    {
      id: 'incidents',
      label: 'Incidents Queue',
      icon: 'incidents',
      badge: pendingCount > 0 ? `${pendingCount} review` : null,
      badgeColor: 'amber'
    },
    {
      id: 'activity',
      label: 'Agent Activity',
      icon: 'activity',
      badge: '5 Agents',
      badgeColor: 'teal'
    },
    {
      id: 'responders',
      label: 'Responders',
      icon: 'responders',
      badge: null
    }
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand-block">
        <div className="brand-logo-icon">
          <Icon name="ripple" size={26} color="var(--teal-400)" />
        </div>
        <div className="brand-text-group">
          <h1 className="brand-title">
            Ripple<span className="brand-accent">Mesh</span>
          </h1>
          <span className="brand-tagline font-mono">OFFLINE RESCUE EOC</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <div className="nav-group-title font-mono">OPERATIONAL VIEWS</div>
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              className={`nav-button ${isActive ? 'active' : ''}`}
              onClick={() => onSelectView(item.id)}
            >
              <div className="nav-btn-left">
                <Icon
                  name={item.icon}
                  size={18}
                  color={isActive ? 'var(--teal-400)' : 'var(--text-secondary)'}
                />
                <span className="nav-label">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`nav-pill pill-${item.badgeColor || 'default'} font-mono`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Mesh System Telemetry Card in Sidebar */}
      <div className="sidebar-system-card">
        <div className="system-card-header">
          <div className="status-indicator-dot online-pulse" />
          <span className="system-status-title font-mono">SIMULATED MESH LINK</span>
        </div>

        <div className="system-metrics-list font-mono text-xs">
          <div className="system-metric-row">
            <span className="text-muted">Protocol:</span>
            <span className="text-teal">LoRa P2P + BLE (Mock)</span>
          </div>
          <div className="system-metric-row">
            <span className="text-muted">Repeaters:</span>
            <span>14 active (Simulated)</span>
          </div>
          <div className="system-metric-row">
            <span className="text-muted">Backend / DB:</span>
            <span className="text-amber">Unconnected (Demo)</span>
          </div>
          <div className="system-metric-row">
            <span className="text-muted">AI Runtime:</span>
            <span className="text-teal">Local Mock Engine</span>
          </div>
        </div>

        <div className="mesh-crypto-tag font-mono text-xs">
          Simulated Ed25519 Signatures
        </div>
      </div>

      {/* Sidebar Footer info */}
      <div className="sidebar-footer font-mono text-xs text-muted">
        <div>EOC Station ID: RM-ALPHA-01</div>
        <div>Firmware: v2.4.0-mesh (Offline)</div>
      </div>
    </aside>
  );
}
