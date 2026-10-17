import React, { useState, useMemo } from 'react';
import { Icon } from './Icons';
import { StatusBadge } from './StatusBadge';
import { SeverityBadge } from './SeverityBadge';

export function IncidentList({
  incidents = [],
  selectedIncidentId,
  onSelectIncident,
  initialFilter = 'all'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState(initialFilter === 'critical' ? 'critical' : 'all');
  const [statusFilter, setStatusFilter] = useState(initialFilter === 'pending' ? 'pending review' : 'all');
  const [sortBy, setSortBy] = useState('urgency'); // 'urgency' | 'time' | 'trust'

  // Severity rank priority weights (Urgency is prioritized first)
  const severityRank = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  const filteredIncidents = useMemo(() => {
    return incidents
      .filter((inc) => {
        // Search term matching
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = inc.id?.toLowerCase().includes(q);
          const matchHazard = inc.hazardType?.toLowerCase().includes(q);
          const matchTitle = inc.title?.toLowerCase().includes(q);
          const matchLoc = inc.location?.name?.toLowerCase().includes(q);
          if (!matchId && !matchHazard && !matchTitle && !matchLoc) {
            return false;
          }
        }

        // Severity filter
        if (severityFilter !== 'all') {
          if (inc.severity?.toLowerCase() !== severityFilter.toLowerCase()) {
            return false;
          }
        }

        // Status filter
        if (statusFilter !== 'all') {
          if (inc.status?.toLowerCase() !== statusFilter.toLowerCase()) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'urgency') {
          const rankA = severityRank[a.severity?.toLowerCase()] || 0;
          const rankB = severityRank[b.severity?.toLowerCase()] || 0;
          if (rankB !== rankA) {
            return rankB - rankA;
          }
          // Secondary sort: Pending reviews come before resolved
          return new Date(b.reportedAt) - new Date(a.reportedAt);
        } else if (sortBy === 'time') {
          return new Date(b.reportedAt) - new Date(a.reportedAt);
        } else if (sortBy === 'trust') {
          return (b.trustScore || 0) - (a.trustScore || 0);
        }
        return 0;
      });
  }, [incidents, searchQuery, severityFilter, statusFilter, sortBy]);

  const getHazardIcon = (hazard) => {
    const h = hazard?.toLowerCase() || '';
    if (h.includes('flood') || h.includes('water')) return 'flood';
    if (h.includes('collapse') || h.includes('structural')) return 'collapse';
    if (h.includes('gas') || h.includes('chemical')) return 'gas';
    if (h.includes('medical') || h.includes('trauma')) return 'medical';
    if (h.includes('power') || h.includes('electric') || h.includes('grid')) return 'power';
    if (h.includes('bridge') || h.includes('road')) return 'bridge';
    if (h.includes('fire')) return 'fire';
    return 'alertTriangle';
  };

  return (
    <div className="incident-list-container">
      {/* List Header & Controls */}
      <div className="incident-list-header">
        <div className="incident-list-title-row">
          <div className="title-with-badge">
            <h2 className="section-heading">Ranked Incidents</h2>
            <span className="count-pill">{filteredIncidents.length} of {incidents.length}</span>
          </div>
          <span className="live-mesh-tag">
            <span className="mesh-pulse-dot" /> Mesh Ingestion Active
          </span>
        </div>

        {/* Filter bar */}
        <div className="filter-controls-row">
          <div className="search-input-box">
            <Icon name="search" size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search by ID, hazard, or sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-input"
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <Icon name="cross" size={12} />
              </button>
            )}
          </div>

          <div className="dropdown-filter-group">
            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="filter-select"
              aria-label="Filter by Severity"
            >
              <option value="all">Severity: All</option>
              <option value="critical">Critical Only</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
              aria-label="Filter by Status"
            >
              <option value="all">Status: All</option>
              <option value="pending review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="in progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select sort-select"
              aria-label="Sort Incidents"
            >
              <option value="urgency">Sort: Urgency Rank</option>
              <option value="time">Sort: Newest First</option>
              <option value="trust">Sort: Trust Score</option>
            </select>
          </div>
        </div>

        {/* Quick distinction note */}
        <div className="triage-principle-callout">
          <Icon name="shield" size={13} color="var(--teal-400)" />
          <span>
            <strong>Offline Triage Policy:</strong> Urgency, AI confidence, and trust scores are decoupled. Critical incidents with single unverified witnesses maintain high triage priority.
          </span>
        </div>
      </div>

      {/* Incident List Rows */}
      <div className="incident-items-scroll">
        {filteredIncidents.length === 0 ? (
          <div className="empty-state-card">
            <Icon name="search" size={32} color="var(--text-muted)" />
            <p className="empty-state-title">No incidents match current filters</p>
            <p className="empty-state-desc">Try loosening search keywords or resetting status/severity filters.</p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchQuery('');
                setSeverityFilter('all');
                setStatusFilter('all');
              }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const isSelected = incident.id === selectedIncidentId;
            const isCritical = incident.severity?.toLowerCase() === 'critical';
            const isSingleWitnessCritical = isCritical && incident.witnessCount === 1;

            return (
              <div
                key={incident.id}
                className={`incident-card-item ${isSelected ? 'selected' : ''} ${isCritical ? 'critical-border' : ''}`}
                onClick={() => onSelectIncident(incident.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectIncident(incident.id);
                  }
                }}
              >
                {/* Left Hazard Accent Icon */}
                <div className={`hazard-avatar-box hazard-${incident.severity?.toLowerCase()}`}>
                  <Icon name={getHazardIcon(incident.hazardType)} size={20} />
                </div>

                {/* Main Info */}
                <div className="incident-card-content">
                  <div className="incident-top-meta">
                    <span className="incident-id-tag">{incident.id}</span>
                    <span className="hazard-type-label">{incident.hazardType}</span>
                    <SeverityBadge severity={incident.severity} />
                    <StatusBadge status={incident.status} size="sm" />
                    <span className="time-ago-tag">
                      <Icon name="clock" size={11} /> {incident.displayTime}
                    </span>
                  </div>

                  <h3 className="incident-card-title">{incident.title}</h3>

                  <div className="incident-location-row">
                    <Icon name="mapPin" size={13} color="var(--text-secondary)" />
                    <span className="location-name">{incident.location?.name}</span>
                  </div>

                  {/* Decoupled Telemetry Metrics Row */}
                  <div className="incident-metrics-grid">
                    {/* Confidence Score */}
                    <div className="metric-pill" title="AI confidence in parsing & extraction">
                      <span className="metric-label">AI Conf:</span>
                      <span className="metric-value font-mono">
                        {Math.round(incident.confidenceScore * 100)}%
                      </span>
                    </div>

                    {/* Trust Score */}
                    <div className="metric-pill" title="Cryptographic verification & source reputation">
                      <span className="metric-label">Trust:</span>
                      <span className={`metric-value font-mono ${incident.trustScore < 0.7 ? 'text-amber' : 'text-teal'}`}>
                        {Math.round(incident.trustScore * 100)}%
                      </span>
                    </div>

                    {/* Witnesses */}
                    <div className={`metric-pill ${isSingleWitnessCritical ? 'witness-warning' : ''}`} title="Independent corroborated witness reports">
                      <span className="metric-label">Witnesses:</span>
                      <span className="metric-value font-mono">
                        {incident.witnessCount} {incident.witnessCount === 1 ? 'source' : 'sources'}
                      </span>
                    </div>

                    {isSingleWitnessCritical && (
                      <span className="single-source-alert" title="Critical urgency retained despite single witness">
                        <Icon name="alertTriangle" size={11} /> High Urgency / 1 Witness
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Arrow indicator */}
                <div className="select-arrow-col">
                  <Icon name="chevronRight" size={16} color={isSelected ? 'var(--teal-400)' : 'var(--text-muted)'} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
